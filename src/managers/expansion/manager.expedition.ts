import _ from "lodash";
import { ErrorMapper } from "utils/ErrorMapper";
import { CreepRole } from "enums/enum.roles";
import { ServerResponse } from "http";
import { remoteMineExpeditionHandler } from "./manager.remoteMineExpedition";

// TODO: Fix the issue with creeps ending the expedition early. Most likely has to do with assignment of creeps to nodes and creeps reporting without assignment.

export class ExpeditionManager {
    private expeditionResultsHandlerMap: Map<string, IExpeditionResultsHandlerConstructor>;

    constructor() {
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
                    assignedExpedition.progress.foundTargets = _.concat(_.difference(findings, assignedExpedition.progress.foundTargets), assignedExpedition.progress.foundTargets);
                }
            }
            if (!this.searchForAssignee(creep.name, assignedExpedition.progress.searchTreeOriginNode)) {
                // Shouldn't be possible, but again, log it.
                console.log(`Could not update scanned flag for creep: ${creep.name}. Tree is below.`);
                console.log(JSON.stringify(assignedExpedition.progress.searchTreeOriginNode));
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
            console.log(JSON.stringify(expedition.progress.searchTreeOriginNode));
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
            const CreepOrders: ScoutOrder = {
                target: creep.memory.orders.target,
                searchTarget: expedition.target,
                independentOperator: creep.memory.orders.independentOperator
            };
            creep.memory.orders = CreepOrders;
            creep.memory.working = true;
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
                    this.checkForAdditionalAssignments(creep, expedition, false);
                }
            }
            else {
                creep.memory.working = false;
            }
        }
    }

    public endExpedition(expedition: Expedition) {
        if (expedition.progress.foundTargets.length === 0) {
            console.log("Expedition was an abject failure chaps");
            console.log(JSON.stringify(expedition));
            this.killExpeditionMembers(expedition);
            _.remove(Memory.expeditions, (e) => e === expedition);
        }
        else {
            // this.orphanCreeps(expedition);
            this.killExpeditionMembers(expedition);
            this.createAndStoreExpeditionResults(expedition.expeditionTypeName, expedition.progress.foundTargets, Game.spawns[expedition.spawnOrigin]);
            _.remove(Memory.expeditions, (e) => e === expedition);
        }
    }

    private orphanCreeps(expedition: Expedition) {
        for (const name in expedition.assignedCreeps) {
            const creep = Game.creeps[name];
            if (creep) {
                creep.memory.working = false;
            }
        }
    }

    private killExpeditionMembers(expedition: Expedition) {
        for (const name in expedition.assignedCreeps) {
            const creep = Game.creeps[name];
            if (creep) {
                this.terminateCreep(creep);
            }
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
            if (tree.assignedCreep === "") {
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

