import _ from "lodash";
import { ErrorMapper } from "utils/ErrorMapper";
import { CreepRole } from "enums/enum.roles";
import { ServerResponse } from "http";
import { remoteMineExpeditionHandler } from "./manager.remoteMineExpedition";

export class ExpeditionManager {
    private branchTraversalDebugging!: boolean;
    private expeditionResultsHandlerMap: Map<string, IExpeditionResultsHandlerConstructor>;

    constructor(branchTraversalDebugging: boolean) {
        this.branchTraversalDebugging = branchTraversalDebugging;
        this.expeditionResultsHandlerMap = new Map<string, IExpeditionResultsHandlerConstructor>()
        this.expeditionResultsHandlerMap.set('remoteMiningSource', remoteMineExpeditionHandler)
    }

    public reportForInitialAssignment(creep: Creep) {
        if (Memory.expeditions.length > 0) {
            for (let expedition of Memory.expeditions) {
                if (expedition?.additionalPersonnelNeeded > 0) {
                    return this.processOriginalOrders(expedition, creep);
                }
            }
        }
        // If we haven't found orders to distribute, terminate
        this.terminateCreep(creep);
    }

    public reportFindings(creep: Creep, findings: string[]) {
        const assignedExpedition = this.getExpeditionAssignment(creep.name);
        if (assignedExpedition) {
            if (Game.spawns[assignedExpedition.spawnOrigin].room.name !== creep.room.name) {
                if (findings && findings.length > 0) {
                    assignedExpedition.progress.foundTargets = _.concat(assignedExpedition.progress.foundTargets, findings);
                }
            }

            if (creep.memory.orders?.independentOperator === false) {
                if (!this.searchForAssignee(creep.name, assignedExpedition.progress.searchTreeOriginNode)) {
                    // Shouldn't be possible, but again, log it.
                    console.log(`Could not update scanned flag for creep: ${creep.name}. Tree is below.`);
                    console.log(JSON.stringify(assignedExpedition.progress.searchTreeOriginNode));
                }
            }
            this.checkForAdditionalAssignments(creep, assignedExpedition, true);

        }
        else {
            // Shouldn't be possible, but if so log it.
            console.log(`Strangely, we receive findings of ${JSON.stringify(findings)} from rogue creep ${creep.name}`);
            this.terminateCreep(creep);
        }
    }

    public reassignmentRequest(creep: Creep) {
        const assignedExpedition = this.getExpeditionAssignment(creep.name);
        if (assignedExpedition) {
            this.checkForAdditionalAssignments(creep, assignedExpedition, false);
        }
        else {
            this.reportForInitialAssignment(creep);
        }
    }

    private getExpeditionAssignment(name: string): Expedition | null {
        if (Memory.expeditions.length > 0) {
            for (const expedition of Memory.expeditions) {
                //console.log(`Assigned Creeps are ${JSON.stringify(expedition.assignedCreeps)}`);
                if (expedition?.assignedCreeps.includes(name)) {
                    //console.log(`${name} was found in the assigned creeps array.`);
                    return expedition;
                }
            }
        }
        return null;
    }

    private processOriginalOrders(expedition: Expedition, creep: Creep) {
        creep.memory.orders = null;
        if (this.determineTargetLeaf(expedition.progress.searchTreeOriginNode, creep)) {
            // Check if we can get directions
            this.createOrders(creep, expedition);
            expedition.additionalPersonnelNeeded -= 1;
            expedition.assignedCreeps.push(creep.name);
        }
        else {
            creep.memory.working = false;
        }
    }

    private createOrders(creep: Creep, expedition: Expedition) {
        if (creep.memory.orders) {
            //const roomPath = this.determineDirections(creep, expedition.progress.searchTreeOriginNode);
            //if (roomPath && roomPath.length > 0) {
            // Update creep memory
            const CreepOrders: ScoutOrder = {
                target: creep.memory.orders.target,
                searchTarget: expedition.target,
                independentOperator: creep.memory.orders.independentOperator,
                //roomPath: roomPath
            };
            creep.memory.orders = CreepOrders;
            creep.memory.working = true;
            //}
            //else {
            // Failure should already be logged, just kill the creep as this shouldn't happen.
            //  this.terminateCreep(creep);
            //}
        }
        else {
            // Code should not be called this way.
            console.log(ErrorMapper.sourceMappedStackTrace("You need to ensure that we actually have a target before you create an order"));
        }

    }

    private checkForAdditionalAssignments(creep: Creep, expedition: Expedition, increaseSearchDepth: boolean) {
        if (creep.memory?.orders) {
            // Check if we have finished the traversal.
            if (this.determineTargetLeaf(expedition.progress.searchTreeOriginNode, creep)) {
                this.createOrders(creep, expedition);
            }
            else if (increaseSearchDepth) {
                // No remaining targets, check if we have a hit and can end the expedition.
                if (expedition.progress.foundTargets.length > 0) {
                    console.log(`Ending expedition, found targets: ${JSON.stringify(expedition.progress.foundTargets)}`)
                    this.endExpedition(expedition);
                }
                else {
                    // Need to expand our search window.
                    this.expandExpedition(expedition);
                }
            }
            else {
                creep.memory.working = false;
            }
        }
    }

    private endExpedition(expedition: Expedition) {
        if (expedition.progress.foundTargets.length === 0) {
            console.log("Expedition was an abject failure chaps");
            console.log(JSON.stringify(expedition));
            delete Memory.expeditions[_.indexOf(Memory.expeditions, expedition)];
        }
        else {
            expedition.progress.complete = true;
            expedition.assignedCreeps = [];
            this.createAndStoreExpeditionResults(expedition.expeditionTypeName, expedition.progress.foundTargets, Game.spawns[expedition.spawnOrigin]);
            //delete Memory.expeditions[_.indexOf(Memory.expeditions, expedition)];
        }
    }

    private createAndStoreExpeditionResults(expeditionTypeName: string, targetIds: string[], spawn: StructureSpawn) {
        const ExpeditionResultsHandler = this.expeditionResultsHandlerMap.get(expeditionTypeName);
        if (typeof ExpeditionResultsHandler !== 'undefined') {
            const expeditionResultsHandler = new ExpeditionResultsHandler(targetIds, expeditionTypeName);
            expeditionResultsHandler.storeResults(spawn);
        }
    }

    private expandExpedition(expedition: Expedition) {
        // Recursively expand the search tree, adding children only to childless nodes.
        if (expedition.progress.searchDepth === expedition.progress.maxDepth) {
            console.log("Max search depth has been reached for expedition.");
            this.endExpedition(expedition);
        }
        else {
            expedition.progress.searchDepth += 1;
            this.recursiveExpand(expedition.progress.searchTreeOriginNode, expedition);
        }
        this.assignMembersToWorking(expedition);
    }

    private assignMembersToWorking(expedition: Expedition) {
        for (const creepName in expedition.assignedCreeps) {
            const creep: Creep = Game.creeps[creepName];
            if (creep) {
                creep.memory.working = true;
            }
        }
    }

    private determineDirections(creep: Creep, tree: ScreepsSearchTree): string[] {
        if (creep.memory.orders) {
            const destination = creep.memory.orders?.target;
            // Check if we are receiving directions from the origin
            if (creep.room.name === tree.nodeName) {
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

    public initialExpansion(tree: ScreepsSearchTree, expedition: Expedition): boolean {
        if (expedition.progress.searchDepth === 0) {
            expedition.progress.searchDepth++;
            if (this.recursiveExpand(tree, expedition)) {
                return true;
            }
        }
        return false;
    }

    private recursiveExpand(tree: ScreepsSearchTree, expedition: Expedition): ScreepsSearchTree {
        if (tree.children.length === 0) {
            // Add new children to this node.
            let roomsToAdd = _.compact(_.difference(_.values(Game.map.describeExits(tree.nodeName)), expedition.progress.plottedRooms));
            if (roomsToAdd) {
                expedition.progress.plottedRooms = _.concat(expedition.progress.plottedRooms, this.addLeaves(roomsToAdd, expedition, tree));
            }
            return tree;
        }
        else {
            for (let child of tree.children) {
                this.recursiveExpand(child, expedition);
            }
        }
        return tree;
    }

    private addLeaves(leavesToAdd: string[], expedition: Expedition, tree: ScreepsSearchTree): string[] {
        console.log(`Adding the following leaves to the expedition: ${JSON.stringify(leavesToAdd)}`);
        const spawn: StructureSpawn = Game.spawns[expedition.spawnOrigin];
        for (const leaf of leavesToAdd) {
            // if(Game.map.)
            const childLeaf: ScreepsSearchTree = {
                children: [],
                nodeName: leaf,
                assignedCreep: "",
                scanned: false
            };
            tree.children.push(childLeaf);
            expedition.additionalPersonnelNeeded += 1;
        }
        this.requestScout(spawn);
        return leavesToAdd;
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
        if (this.branchTraversalDebugging) {
            console.log(`Target Branch is: ${JSON.stringify(targetBranch)}`);
            console.log(`Current Branch is: ${JSON.stringify(currentBranch)}`);
        }
        if (targetBranch.length > 0 && currentBranch.length > 0) {
            // We have the two paths, find the intersection index.
            currentBranch = _.reverse(currentBranch);
            if (this.branchTraversalDebugging) {
                console.log(`Current Branch reversed is: ${JSON.stringify(currentBranch)}`);
            }

            for (let i = 0; i < currentBranch.length; i++) {
                for (let j = 0; j < targetBranch.length; j++) {
                    if (currentBranch[i] === targetBranch[j]) {
                        if (this.branchTraversalDebugging) {
                            console.log(`Intersection found. Concat is below`);
                            console.log(JSON.stringify(_.concat(_.slice(currentBranch, 0, i), _.slice(targetBranch, j + 1, targetBranch.length))));
                            console.log(JSON.stringify(_.slice(currentBranch, 0, i)));
                            console.log(JSON.stringify(_.slice(targetBranch, j + 1, targetBranch.length)));
                        }
                        // We have found our intersection, return the branch traversal.
                        return _.concat(_.slice(currentBranch, 0, i), _.slice(targetBranch, j + 1, targetBranch.length));
                    }
                }
            }
        }
        // Traversal failed, log it.
        if (this.branchTraversalDebugging) {
            console.log(`Could not determine branch to branch traversal for ${creep.name}. Full tree is:`);
            console.log(JSON.stringify(tree));
        }

        return [];
    }

    private getOriginTraversal(creep: Creep, tree: ScreepsSearchTree, destination: string): string[] {
        let branchPath: string[] = [];
        const originName = this.scanForLeafFromOrigin(tree, destination, branchPath);
        if (this.branchTraversalDebugging) {
            console.log(`originName is ${originName}`)
        }
        if (originName !== "") {
            return _.concat([originName], branchPath);
        }
        else {
            // Should not get here, log
            if (this.branchTraversalDebugging) {
                console.log(`Could not determine origin traversal for ${creep.name}. Full tree is:`);
                console.log(JSON.stringify(tree));
            }
            return [];
        }
    }

    private scanForLeafFromOrigin(tree: ScreepsSearchTree, targetLeaf: string, branchPath: string[]): string {
        if (this.branchTraversalDebugging) {
            console.log(`leaf is ${targetLeaf}. tree is ${tree.nodeName}`);
        }
        if (tree.nodeName === targetLeaf) {
            return tree.nodeName;
        }
        else {
            if (tree.children) {
                for (const child of tree.children) {
                    const childScan: string = this.scanForLeafFromOrigin(child, targetLeaf, branchPath);
                    if (childScan !== "") {
                        if (this.branchTraversalDebugging) {
                            console.log(`Pushing childNode of ${childScan} onto the branch`);
                            console.log(`Before push, branch is ${JSON.stringify(branchPath)}`);
                        }
                        branchPath.push(childScan);
                        return tree.nodeName;
                    }
                }
            }
            else {
                return "";
            }
        }
        return "";
    }

    private searchForAssignee(assigneeName: string, tree: ScreepsSearchTree): boolean {
        //console.log(`Searching for assignee: ${assigneeName}. In ${tree.nodeName}`);
        if (tree.assignedCreep !== assigneeName) {
            if (tree.children.length > 0) {
                for (let childTree of tree.children) {
                    if (this.searchForAssignee(assigneeName, childTree)) {
                        return true;
                    }
                }
            }
            else {
                return false;
            }
        }
        else {
            tree.scanned = true;
            tree.assignedCreep = "";
            return true;
        }
        return false;
    }

    private findLeaf(nodeName: string, tree: ScreepsSearchTree): ScreepsSearchTree | null {
        if (tree.nodeName !== nodeName) {
            for (let childLeaf of tree.children) {
                if (this.findLeaf(nodeName, childLeaf)) {
                    return childLeaf;
                }
            }
        }
        else {
            return tree;
        }
        return null;
    }

    // Finds an unscanned leaf and assigns the creep to it.
    private determineTargetLeaf(tree: ScreepsSearchTree, creep: Creep): boolean {
        //console.log(`Node: ${tree.nodeName} | Creep ${creep.name} | Scanned: ${tree.scanned} | LeafTraversalCount ${counter.leafTraversalCount} | nodeCount: ${counter.nodeCount}`);
        if (tree.nodeName !== creep.room.name) {
            //Check if we can do a direct path to a child.
            let subTree = this.findLeaf(creep.room.name, tree);
            if (subTree) {
                if (this.searchAndAssignForTarget(subTree, creep)) {
                    return true;
                }
            }
        }
        return this.searchAndAssignForTarget(tree, creep);

    }

    private searchAndAssignForTarget(tree: ScreepsSearchTree, creep: Creep) {
        if (tree.scanned) {
            for (let childLeaf of tree.children) {
                if (this.searchAndAssignForTarget(childLeaf, creep)) {
                    return true;
                }
            }
        }
        else {
            if (tree.assignedCreep == "") {
                tree.assignedCreep = creep.name;
                this.setOrdersTarget(creep, tree, false);
                return true;
            }
        }
        return false;
    }


    private setOrdersTarget(creep: Creep, tree: ScreepsSearchTree, independentOperator: boolean) {
        if (creep.memory.orders) {
            creep.memory.orders.target = tree.nodeName;
        }
        else {
            creep.memory.orders = { target: tree.nodeName, independentOperator: independentOperator };
        }
    }

    private terminateCreep(creep: Creep) {
        creep.say("😞 guess I'm not needed");
        creep.suicide();
    }
}

