import _ from "lodash";
import { ErrorMapper } from "utils/ErrorMapper";
import { CreepRole } from "enums/enum.roles";

export class ExpeditionManager {

    public reportForInitialAssignment(creep: Creep) {
        if (Memory.expeditions.length > 0) {
            for (let expedition of Memory.expeditions) {
                if (expedition.additionalPersonnelNeeded > 0) {
                    return this.processOrders(expedition, creep);
                }
            }
        }
        // If we haven't found orders to distribute, terminate
        this.terminateCreep(creep);
    }

    public reportFindings(creep: Creep, findings: string[]) {
        const assignedExpedition = this.getExpeditionAssignment(creep.name);
        if (assignedExpedition) {
            if (Game.spawns[assignedExpedition.expedition.spawnOrigin].room.name !== creep.room.name) {
                if (findings && findings.length > 0) {
                    assignedExpedition.expedition.progress.foundTargets = _.concat(assignedExpedition.expedition.progress.foundTargets, findings);
                }
            }
            const updatedTree = this.searchForAssignee(creep.name, assignedExpedition.expedition.progress.searchTreeOriginNode);
            if (updatedTree) {
                assignedExpedition.expedition.progress.searchTreeOriginNode = updatedTree;
            }
            else {
                // Shouldn't be possible, but again, log it.
                console.log(`Could not update scanned flag for creep: ${creep.name}. Tree is below.`);
                console.log(JSON.stringify(assignedExpedition.expedition.progress.searchTreeOriginNode));
            }
            this.checkForAdditionalAssignments(creep, assignedExpedition.expedition);
            // Update the expedition in memory.
            Memory.expeditions[assignedExpedition.index] = assignedExpedition.expedition;

        }
        else {
            // Shouldn't be possible, but if so log it.
            console.log(`Strangely, we receive findings of ${JSON.stringify(findings)} from rogue creep ${creep.name}`);
        }
    }

    private getExpeditionAssignment(name: string): ExpeditionAssignment | null {
        if (Memory.expeditions.length > 0) {
            for (let index = 0; index < Memory.expeditions.length; index++) {
                console.log(`Assigned Creeps are ${JSON.stringify(Memory.expeditions[index].assignedCreeps)}`);
                if (Memory.expeditions[index].assignedCreeps.includes(name)) {
                    console.log(`${name} was found in the assigned creeps array.`);
                    return { expedition: Memory.expeditions[index], index: index };
                }
            }
        }
        return null;
    }

    private processOrders(expedition: Expedition, creep: Creep) {
        expedition.progress.searchTreeOriginNode = this.determineTargetLeaf(expedition.progress.searchTreeOriginNode, creep);
        if (creep.memory.orders?.target) {
            // Check if we can get directions
            this.createOrders(creep, expedition);
            expedition.additionalPersonnelNeeded -= 1;
            expedition.assignedCreeps.push(creep.name);
        }
        else {
            // Should not really happen. If it does, log this.
            console.log(`Could not process expeditions orders for ${creep.name}. Full expedition is:`);
            console.log(JSON.stringify(expedition));
        }
    }

    private createOrders(creep: Creep, expedition: Expedition) {
        if (creep.memory.orders) {
            const roomPath = this.determineDirections(creep, expedition.progress.searchTreeOriginNode);
            if (roomPath && roomPath.length > 0) {
                // Update creep memory
                const CreepOrders: ScoutOrder = {
                    target: creep.memory.orders.target,
                    searchTarget: expedition.target,
                    independentOperator: true,
                    roomPath: roomPath
                };
                creep.memory.orders = CreepOrders;
                creep.memory.working = true;
            }
            else {
                // Failure should already be logged, just kill the creep as this shouldn't happen.
                this.terminateCreep(creep);
            }
        }
        else {
            // Code should not be called this way.
            console.log(ErrorMapper.sourceMappedStackTrace("You need to ensure that we actually have a target before you create order"));
        }

    }

    private checkForAdditionalAssignments(creep: Creep, expedition: Expedition) {
        if (creep.memory.orders) {
            // Clear out creep orders.
            creep.memory.orders.target = "";
            expedition.progress.searchTreeOriginNode = this.determineTargetLeaf(expedition.progress.searchTreeOriginNode, creep);
            // Check if we received a target
            if (creep.memory.orders.target !== "") {
                // Targets remain, send the creep forth.
                this.createOrders(creep, expedition);
            }
            else {
                // No remaining targets, check if we have a hit and can end the expedition.
                if (expedition.progress.foundTargets.length > 0) {
                    console.log(`Ending expedition, found targets: ${JSON.stringify(expedition.progress.foundTargets)}`)
                    this.endExpedition(creep, expedition);
                }
                else {
                    // Need to expand our search window.
                    this.expandExpedition(expedition);
                }
            }
        }
    }

    private expandExpedition(expedition: Expedition) {
        // Recursively expand the search tree, adding children only to childless nodes.
        this.recursiveExpand(expedition.progress.searchTreeOriginNode, [], expedition);
    }

    private endExpedition(creep: Creep, expedition: Expedition) {
        expedition.progress.complete = true;
        expedition.assignedCreeps = [];
        // Add the data below for early memory cleanup, but wait until we actually have the code to handle this implemented.
        //delete expedition.progress.searchTreeOriginNode;
    }

    private determineDirections(creep: Creep, tree: ScreepsSearchTree): string[] {
        if (creep.memory.orders) {
            const destination = creep.memory.orders?.target;
            // Check if we are receiving directions from the origin
            if (creep.room.name === tree.roomName) {
                return this.getOriginTraversal(creep, tree, destination)
            }
            else {
                return this.branchToBranchTraversal(creep, tree, destination);
            }
        }
        else {
            // Shouldn't get here, let the console know.
            console.log(`Received no target for creep ${creep.name}`);
            return [];
        }

    }


    private recursiveExpand(tree: ScreepsSearchTree, currentRooms: string[], expedition: Expedition): ScreepsSearchTree {
        // Always add the current node.
        currentRooms.push(tree.roomName);
        if (tree.children.length === 0) {
            // Add new children to this node.
            let roomsToAdd = _.compact(_.difference(_.values(Game.map.describeExits(tree.roomName)), currentRooms));
            if (roomsToAdd) {
                console.log(`Adding the following rooms to the expedition: ${JSON.stringify(roomsToAdd)}`);
                const spawn: StructureSpawn = Game.spawns[expedition.spawnOrigin]
                currentRooms = _.concat(currentRooms, roomsToAdd);
                for (const roomToAdd of roomsToAdd) {
                    const childLeaf: ScreepsSearchTree = {
                        children: [],
                        roomName: roomToAdd,
                        assignedCreep: "",
                        scanned: false
                    };
                    tree.children.push(childLeaf);
                    expedition.additionalPersonnelNeeded += 1;
                    this.requestScout(spawn);
                }
            }
            return tree;
        }
        else {
            for (let child of tree.children) {
                child = this.recursiveExpand(child, currentRooms, expedition);
            }
        }
        return tree;
    }

    private requestScout(spawn: StructureSpawn) {
        const creepRequest: CreepRequest = {
            role: CreepRole.scout,
            body: [MOVE]
        };
        if (!spawn.memory.remoteCreepRequest) {
            spawn.memory.remoteCreepRequest = [];
        }

        spawn.memory.remoteCreepRequest.push(creepRequest);

    }


    private branchToBranchTraversal(creep: Creep, tree: ScreepsSearchTree, destination: string): string[] {
        // Need to traverse back up the tree.
        let targetBranch = this.getOriginTraversal(creep, tree, destination);
        let currentBranch = this.getOriginTraversal(creep, tree, creep.room.name);
        console.log(`Target Branch is: ${JSON.stringify(targetBranch)}`);
        console.log(`Current Branch is: ${JSON.stringify(currentBranch)}`);
        if (targetBranch.length > 0 && currentBranch.length > 0) {
            // We have the two paths, find the intersection index.
            currentBranch = _.reverse(currentBranch);
            console.log(`Current Branch reversed is: ${JSON.stringify(currentBranch)}`);
            for (let i = 0; i < currentBranch.length; i++) {
                for (let j = 0; j < targetBranch.length; j++) {
                    if (currentBranch[i] === targetBranch[j]) {
                        console.log(`Intersection found. Concat is below`);
                        console.log(JSON.stringify(_.concat(_.slice(currentBranch, 0, i), _.slice(targetBranch, j, targetBranch.length))));
                        console.log(JSON.stringify(_.slice(currentBranch, 0, i)));
                        console.log(JSON.stringify(_.slice(targetBranch, j, targetBranch.length)));
                        // We have found our intersection, return the branch traversal.
                        return _.concat(_.slice(currentBranch, 0, i), _.slice(targetBranch, j, targetBranch.length));
                    }
                }
            }
        }
        // Traversal failed, log it.
        console.log(`Could not determine branch to branch traversal for ${creep.name}. Full tree is:`);
        console.log(JSON.stringify(tree));
        return [];
    }

    private getOriginTraversal(creep: Creep, tree: ScreepsSearchTree, destination: string): string[] {
        let branchPath: string[] = [];
        const originName = this.scanForLeafFromOrigin(tree, destination, branchPath);
        console.log(`originName is ${originName}`)
        if (originName !== "") {
            return _.concat([originName], branchPath);
        }
        else {
            // Should not get here, log
            console.log(`Could not determine origin traversal for ${creep.name}. Full tree is:`);
            console.log(JSON.stringify(tree));
            return [];
        }
    }

    private scanForLeafFromOrigin(tree: ScreepsSearchTree, targetLeaf: string, branchPath: string[]): string {
        console.log(`leaf is ${targetLeaf}. tree is ${tree.roomName}`);
        if (tree.roomName === targetLeaf) {
            return tree.roomName;
        }
        else {
            if (tree.children) {
                for (const child of tree.children) {
                    const childScan: string = this.scanForLeafFromOrigin(child, targetLeaf, branchPath);
                    if (childScan !== "") {
                        console.log(`Pushing childNode of ${childScan} onto the branch`);
                        console.log(`Before push, branch is ${JSON.stringify(branchPath)}`);
                        branchPath.push(childScan);
                        return tree.roomName;
                    }
                }
            }
            else {
                return "";
            }
        }
        return "";
    }

    private searchForAssignee(assigneeName: string, tree: ScreepsSearchTree): ScreepsSearchTree | null {
        console.log(`Searching for assignee: ${assigneeName}. In ${tree.roomName}`);
        if (tree.assignedCreep !== assigneeName) {
            if (tree.children.length > 0) {
                for (let childLeaf of tree.children) {
                    const foundLeaf = this.searchForAssignee(assigneeName, childLeaf);
                    if (foundLeaf) {
                        childLeaf = foundLeaf;
                        return tree;
                    }
                }
            }
            else {
                return null;
            }
        }
        else {
            tree.scanned = true;
            tree.assignedCreep = "";
            return tree;
        }
        return tree;
    }

    private determineTargetLeaf(tree: ScreepsSearchTree, creep: Creep): ScreepsSearchTree {
        if (tree.scanned) {
            for (let childLeaf of tree.children) {
                childLeaf = this.determineTargetLeaf(childLeaf, creep);
                if (childLeaf.assignedCreep === creep.name) {
                    return tree;
                }
            }
        }
        else {
            if (tree.assignedCreep == "") {
                tree.assignedCreep = creep.name;
                if (creep.memory.orders) {
                    creep.memory.orders.target = tree.roomName;
                }
                else {
                    creep.memory.orders = { target: tree.roomName };
                }
            }
            return tree;
        }
        return tree;
    }


    private terminateCreep(creep: Creep) {
        creep.say("😞 guess I'm not needed");
        creep.suicide();
    }
}

interface ExpeditionAssignment {
    // Contains the expedition object for the creep.
    expedition: Expedition;
    // Indicates the index in the master array.
    index: number;
}
