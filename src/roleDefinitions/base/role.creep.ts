import _ from "lodash";
import { getContainer, refreshTree } from "caching/manager.containerSelector";
import { harvestSourceSmart } from "caching/manager.sourceSelector";
import { profile } from "Profiler";
import { ConstructionSiteCacher } from "caching/manager.constructionSiteCacher";
import { CreepRole } from "enums/enum.roles";
import { getdropMapPosition } from "caching/caching.dropPickupCacher";

@profile
export class RoleCreep {
    //* Low RCL Boosting (Pre Containers)
    protected idSpawnForWithdrawal(creep: Creep): boolean {
        if (!creep.room.memory.spawns) {
            creep.room.memory.spawns = [];
            for (const spawn of _.values(Game.spawns)) {
                if (spawn.room.name === creep.room.name) {
                    creep.room.memory.spawns.push(spawn.id);
                }
            }
        }
        for (const spawnId of creep.room.memory.spawns) {
            const spawn: StructureSpawn | null = Game.getObjectById(spawnId);
            if (spawn && spawn.store.getUsedCapacity(RESOURCE_ENERGY) > 200) {
                creep.memory.precious = spawn.id;
                return true;
            }
        }
        return false;
    }

    protected safeSpawnWithdrawal(creep: Creep): boolean {
        if (creep.memory.precious) {
            const spawn: StructureSpawn | null = Game.getObjectById(creep.memory.precious);
            if (spawn && spawn.store.getUsedCapacity(RESOURCE_ENERGY) > 150) {
                this.withdrawMove(creep, spawn);
                return true;
            } else {
                creep.memory.precious = null;
            }
        }
        return false;
    }

    //* Recharge Logic
    protected fillUp(creep: Creep) {
        const link = this.checkForNearbyLink(creep);
        if (link) {
            return this.withdrawMoveCached(creep, link);
        }
        const storage = this.checkStorageForAvailableResource(creep.room, RESOURCE_ENERGY);
        if (storage) {
            return this.withdrawMove(creep, storage);
        }
        if (creep.memory.precious) {
            const container = Game.getObjectById<StructureContainer>(creep.memory.precious);
            if (container) {
                return this.withdrawMove(creep, container);
            } else {
                refreshTree(creep.room, creep.memory.precious);
                creep.memory.precious = null;
            }
        } else if (creep.memory.preciousPosition) {
            this.withdrawPickup(creep, creep.memory.preciousPosition);
            return true;
        }
        const containerId = getContainer(creep);
        if (containerId) {
            if (creep.room.memory.lowRCLBoost) {
                this.lowRCLDropContainerTransition(creep);
                return true;
            } else {
                const container = Game.getObjectById<StructureContainer>(containerId);
                if (container) {
                    creep.memory.precious = container.id;
                    return this.withdrawMove(creep, container);
                } else {
                    refreshTree(creep.room, containerId);
                }
            }
        }
        if (creep.room.memory.lowRCLBoost) {
            const preciousPosition = getdropMapPosition(creep);
            if (preciousPosition) {
                creep.memory.preciousPosition = preciousPosition;
                this.withdrawPickup(creep, creep.memory.preciousPosition);
                return true;
            }
        }
        return harvestSourceSmart(creep);
    }

    protected lowRCLDropContainerTransition(creep: Creep) {
        if (creep.room.memory.dropMap![0].assigned.length < creep.room.memory.containerMap![0].assigned.length) {
            const preciousPosition = getdropMapPosition(creep);
            if (preciousPosition) {
                creep.memory.preciousPosition = preciousPosition;
                this.withdrawPickup(creep, creep.memory.preciousPosition);
            }
        } else {
            const containerId = getContainer(creep);
            if (containerId) {
                const container = Game.getObjectById<StructureContainer>(containerId);
                if (container) {
                    return this.withdrawMove(creep, container);
                } else {
                    refreshTree(creep.room, containerId);
                }
            }
        }
    }

    protected withdrawMoveSpecified(creep: Creep, structure: Structure, resourceType: ResourceConstant) {
        if (creep.pos.isNearTo(structure)) {
            creep.withdraw(structure, resourceType);
            return;
        } else {
            creep.moveTo(structure, { reusePath: 10, ignoreCreeps: false });
            return;
        }
    }

    protected withdrawMoveCached(creep: Creep, structure: Structure) {
        if (creep.pos.isNearTo(structure)) {
            creep.withdraw(structure, RESOURCE_ENERGY);
            if (creep.store.getFreeCapacity() > 25) {
                this.grabAdjacentDroppedEnergy(creep, structure.pos);
            }
            return;
        } else {
            creep.memory.path = creep.pos.findPathTo(structure, { ignoreCreeps: false });
            this.pathHandling(creep);
            return;
        }
    }

    protected withdrawMove(creep: Creep, structure: Structure) {
        if (creep.pos.isNearTo(structure)) {
            creep.withdraw(structure, RESOURCE_ENERGY);
            if (creep.store.getFreeCapacity() > 25) {
                this.grabAdjacentDroppedEnergy(creep, structure.pos);
            }
            return;
        } else {
            creep.moveTo(structure, { reusePath: 10, ignoreCreeps: false });
            return;
        }
    }

    protected withdrawPickup(creep: Creep, pos: { x: number; y: number }) {
        if (creep.pos.isNearTo(pos.x, pos.y)) {
            this.grabAdjacentDroppedEnergy(creep, new RoomPosition(pos.x, pos.y, creep.room.name));
            return;
        } else {
            creep.moveTo(pos.x, pos.y);
            return;
        }
    }

    //* Resource Deposit Logic
    protected fillClosest(creep: Creep, ignoreLinks: boolean, fillUpgraders?: boolean): boolean {
        if (creep.room.memory.target) {
            const tower = this.findClosestTower(creep);
            if (tower) {
                this.depositMove(creep, tower);
                return true;
            }
        }
        if (!ignoreLinks) {
            const link = this.checkForLinktoFill(creep);
            if (link) {
                this.depositMoveCached(creep, link);
                return true;
            }
        }
        const fillable = this.findClosestFillableRespawnStructure(creep);
        if (fillable) {
            this.depositMove(creep, fillable);
            return true;
        }
        const fillableOther = this.findClosestFillableStructure(creep);
        if (fillableOther) {
            this.depositMove(creep, fillableOther);
            return true;
        }
        const terminal = creep.room.terminal;
        if (terminal) {
            this.depositMove(creep, terminal);
        }
        if (fillUpgraders) {
            if (this.refillUpgraders(creep)) {
                return true;
            }
        }
        const storage = this.checkStorageForDeposit(creep.room);
        if (storage) {
            this.depositMoveUnspecified(creep, storage);
            return true;
        }
        return false;
    }

    private refillUpgraders(creep: Creep): boolean {
        const upgraders = creep.room.find(FIND_MY_CREEPS, {
            filter: c => {
                return c.memory.role === CreepRole.upgrader && c.store.getFreeCapacity() > 0;
            }
        });
        if (upgraders && upgraders.length > 0) {
            const transferTarget = _.first(
                _.sortBy(upgraders, u => {
                    return u.store.getUsedCapacity(RESOURCE_ENERGY) + u.pos.getRangeTo(creep);
                })
            );
            if (transferTarget) {
                if (creep.pos.getRangeTo(transferTarget) > 5) {
                    creep.memory.path = creep.pos.findPathTo(transferTarget, { ignoreCreeps: false });
                    this.pathHandling(creep);
                } else {
                    this.transferMove(creep, transferTarget!);
                }
                return true;
            }
        }
        return false;
    }

    protected fill(creep: Creep) {
        const link = this.checkForLinktoFill(creep);
        if (link) {
            return this.depositMove(creep, link);
        }
        const fillable = this.findHighestPriorityFillableStructure(creep);
        if (fillable) {
            return this.depositMove(creep, fillable);
        }
        const storage = this.checkStorageForDeposit(creep.room);
        if (storage) {
            return this.depositMove(creep, storage);
        }
    }

    protected depositMoveUnspecified(creep: Creep, structure: Structure) {
        // console.log(JSON.stringify(structure));
        if (creep.pos.isNearTo(structure)) {
            creep.transfer(structure, <ResourceConstant>_.last(_.keys(creep.store)));
            return;
        } else {
            creep.moveTo(structure, { reusePath: 10, ignoreCreeps: false });
            return;
        }
    }

    protected depositMoveSpecified(creep: Creep, structure: Structure, resourceType: ResourceConstant) {
        // console.log(JSON.stringify(structure));
        if (creep.pos.isNearTo(structure)) {
            creep.transfer(structure, resourceType);
            return;
        } else {
            creep.moveTo(structure, { reusePath: 10, ignoreCreeps: false });
            return;
        }
    }

    protected depositMoveCached(creep: Creep, structure: Structure) {
        // console.log(JSON.stringify(structure));
        if (creep.pos.isNearTo(structure)) {
            creep.transfer(structure, RESOURCE_ENERGY);
            return;
        } else {
            creep.memory.path = creep.pos.findPathTo(structure, { ignoreCreeps: false });
            this.pathHandling(creep);
            return;
        }
    }

    protected depositMove(creep: Creep, structure: Structure) {
        // console.log(JSON.stringify(structure));
        if (creep.pos.isNearTo(structure)) {
            creep.transfer(structure, RESOURCE_ENERGY);
            return;
        } else {
            creep.moveTo(structure, { reusePath: 10, ignoreCreeps: false });
            return;
        }
    }

    protected transferMove(creep: Creep, target: Creep) {
        if (creep.pos.isNearTo(target)) {
            creep.transfer(target, RESOURCE_ENERGY);
            return;
        } else {
            creep.moveTo(target, { reusePath: 10, ignoreCreeps: false });
            return;
        }
    }

    protected checkStorageForAvailableResource(
        room: Room,
        resourceType: ResourceConstant
    ): StructureStorage | undefined {
        if (room.storage) {
            if (room.storage.store.getUsedCapacity(resourceType) > 0) {
                return room.storage;
            }
        }
        return undefined;
    }

    protected checkStorageForDeposit(room: Room): StructureStorage | undefined {
        if (room.storage) {
            if (room.storage.store.getFreeCapacity() > 0) {
                return room.storage;
            }
        }
        return undefined;
    }

    protected findFillableStructure(
        creep: Creep,
        findType: STRUCTURE_LINK | STRUCTURE_STORAGE | STRUCTURE_SPAWN | STRUCTURE_EXTENSION | STRUCTURE_TOWER
    ): Structure | null {
        const queryItem: Structure | null = creep.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: structure => {
                structure.structureType === findType && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
            }
        });
        return queryItem;
    }

    protected findClosestTower(creep: Creep): Structure | null {
        const queryItem: Structure | null = creep.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: structure => {
                return (
                    structure.structureType === STRUCTURE_TOWER && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                );
            }
        });
        // console.log(JSON.stringify(queryItem));
        return queryItem;
    }

    protected findClosestFillableStructure(creep: Creep): Structure | null {
        const queryItem: Structure | null = creep.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: structure => {
                return (
                    (structure.structureType === STRUCTURE_TOWER &&
                        structure.store.getFreeCapacity(RESOURCE_ENERGY) > 100) ||
                    ((structure.structureType === STRUCTURE_EXTENSION || structure.structureType === STRUCTURE_SPAWN) &&
                        structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0)
                );
            }
        });
        // console.log(JSON.stringify(queryItem));
        return queryItem;
    }

    protected findClosestFillableRespawnStructure(creep: Creep): Structure | null {
        const queryItem: Structure | null = creep.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: structure => {
                return (
                    (structure.structureType === STRUCTURE_EXTENSION || structure.structureType === STRUCTURE_SPAWN) &&
                    structure.store.getFreeCapacity(RESOURCE_ENERGY) > 49
                );
            }
        });
        return queryItem;
    }

    // Ultimately, this looks worthless without further caching and subset breakout
    protected findHighestPriorityFillableStructure(creep: Creep): Structure | null {
        const queryItems: Structure[] = creep.room.find(FIND_STRUCTURES, {
            filter: structure => {
                return (
                    (structure.structureType === STRUCTURE_EXTENSION ||
                        structure.structureType === STRUCTURE_SPAWN ||
                        structure.structureType === STRUCTURE_TOWER) &&
                    structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                );
            }
        });
        return _.sortBy(queryItems, item => this.fillOrder(creep.pos, item))[0];
    }

    protected fillOrder(pos: RoomPosition, structure: Structure): number {
        switch (structure.structureType) {
            case STRUCTURE_EXTENSION: {
                return 0 + pos.getRangeTo(structure);
            }
            case STRUCTURE_SPAWN: {
                return 50 + pos.getRangeTo(structure);
            }
            case STRUCTURE_TOWER: {
                return 100 + pos.getRangeTo(structure);
            }
            default: {
                return 150;
            }
        }
    }

    protected checkForAdjacentLinkToFill(creep: Creep): boolean {
        if (creep.memory.adjLink) {
            const link = Game.getObjectById(creep.memory.adjLink);
            if (link && link.store) {
                if (link.store.energy <= 750) {
                    creep.transfer(link, RESOURCE_ENERGY);
                    return true;
                } else {
                    return false;
                }
            } else {
                delete creep.memory.adjLink;
                return false;
            }
        }
        if (creep.room.memory.sourceLinks) {
            const links: StructureLink[] = _.compact(
                _.map(creep.room.memory?.sourceLinks, id => {
                    return Game.getObjectById(id);
                })
            );
            if (links.length > 0) {
                const queryItem: StructureLink | null = creep.pos.findInRange<StructureLink>(links, 1)[0];
                if (queryItem) {
                    creep.memory.adjLink = queryItem.id;
                    return this.checkForAdjacentLinkToFill(creep);
                } else {
                    return false;
                }
            }
        }
        return false;
    }

    protected checkForAdjacentLinkToRecharge(creep: Creep): StructureLink | null {
        if (creep.memory.adjLink) {
            return this.checkLinkForEnergy(creep, creep.memory.adjLink);
        }
        if (creep.room.memory.dumpLinks) {
            const links: StructureLink[] = _.compact(
                _.map(creep.room.memory?.dumpLinks, id => {
                    return Game.getObjectById(id);
                })
            );
            if (links.length > 0) {
                const queryItem: StructureLink | null = creep.pos.findInRange<StructureLink>(links, 1)[0];
                if (queryItem) {
                    creep.memory.adjLink = queryItem.id;
                    return this.checkForAdjacentLinkToRecharge(creep);
                }
            }
        }
        return null;
    }

    protected checkForNearbyLink(creep: Creep): StructureLink | null {
        if (creep.room.memory.dumpLinks) {
            const links: StructureLink[] = _.compact(
                _.map(creep.room.memory?.dumpLinks, id => {
                    return this.checkLinkForEnergy(creep, id);
                })
            );
            if (links.length > 0) {
                const queryItem: StructureLink | null = creep.pos.findInRange<StructureLink>(links, 3)[0];
                return queryItem;
            }
        }
        return null;
    }

    private checkLinkForEnergy(creep: Creep, id: Id<StructureLink>): StructureLink | null {
        const link = Game.getObjectById(id);
        if (link) {
            if (link.store.energy > 50) {
                return link;
            } else {
                return null;
            }
        } else {
            delete creep.memory.adjLink;
            return null;
        }
    }

    private checkLinkForFillable(id: Id<StructureLink>): StructureLink | null {
        const link = Game.getObjectById(id);
        if (link && link.store.energy < 700) {
            return link;
        } else {
            return null;
        }
    }

    protected checkForLinktoFill(creep: Creep): StructureLink | null {
        if (creep.room.memory.sourceLinks) {
            const links: StructureLink[] = _.compact(
                _.map(creep.room.memory?.sourceLinks, id => {
                    return this.checkLinkForFillable(id);
                })
            );
            if (links.length > 0) {
                const queryItem: StructureLink | null = creep.pos.findInRange<StructureLink>(links, 3, {})[0];
                return queryItem;
            }
        }
        return null;
    }

    // ? Do we need this? TODO remove
    protected _checkForAdjacentLinktoFill(creep: Creep): StructureLink | null {
        if (creep.room.memory.sourceLinks) {
            const links: StructureLink[] = _.compact(
                _.map(creep.room.memory?.sourceLinks, id => {
                    return this.checkLinkForFillable(id);
                })
            );
            if (links.length > 0) {
                const queryItem: StructureLink | null = creep.pos.findInRange<StructureLink>(links, 1, {})[0];

                return queryItem;
            }
        }
        return null;
    }

    //* Adjacency Logic
    protected grabAdjacentDroppedEnergy(creep: Creep, adjacentPos: RoomPosition): void {
        const droppedResources = adjacentPos.findInRange(FIND_DROPPED_RESOURCES, 0);
        if (droppedResources && droppedResources.length > 0) {
            creep.pickup(droppedResources[0]);
        }
    }

    // Quite inefficient, but might be able to find an application where it is valueable.
    protected checkForAdjacentDroppedResources(creep: Creep): boolean {
        const droppedResources = creep.pos.findInRange(FIND_DROPPED_RESOURCES, 1);
        if (droppedResources && droppedResources.length > 0) {
            creep.pickup(_.first(droppedResources)!);
            return true;
        }
        return false;
    }

    protected repairRoad(creep: Creep) {
        const road = creep.pos.lookFor(LOOK_STRUCTURES).find(object => object.structureType === STRUCTURE_ROAD);
        const repairPower: number = creep.getActiveBodyparts(WORK) * 100;
        if (road && road.hits + repairPower <= road.hitsMax) {
            creep.repair(road);
        }
    }

    //* Movement
    protected repairMove(creep: Creep, structure: Structure) {
        if (creep.pos.isNearTo(structure)) {
            creep.repair(structure);
            return;
        } else {
            creep.moveTo(structure, { reusePath: 10, ignoreCreeps: false });
            return;
        }
    }

    protected leaveBorder(creep: Creep): boolean {
        if (creep.pos.y === 0) {
            creep.moveTo(creep.pos.x, creep.pos.y + 2);
            return false;
        } else if (creep.pos.y === 49) {
            creep.moveTo(creep.pos.x, creep.pos.y + -2);
            return false;
        } else if (creep.pos.x === 0) {
            creep.moveTo(creep.pos.x + 2, creep.pos.y);
            return false;
        } else if (creep.pos.x === 49) {
            creep.moveTo(creep.pos.x - 2, creep.pos.y);
            return false;
        }
        return true;
    }

    protected oppositeDirection(direction: DirectionConstant): DirectionConstant {
        switch (direction) {
            case TOP: {
                return BOTTOM;
            }
            case TOP_RIGHT: {
                return BOTTOM_LEFT;
            }
            case TOP_LEFT: {
                return BOTTOM_RIGHT;
            }
            case RIGHT: {
                return LEFT;
            }
            case LEFT: {
                return RIGHT;
            }
            case BOTTOM: {
                return TOP;
            }
            case BOTTOM_LEFT: {
                return TOP_RIGHT;
            }
            case BOTTOM_RIGHT: {
                return TOP_LEFT;
            }
        }
    }

    //* Path Cache Handling
    public pathHandling(creep: Creep): boolean {
        if (creep.fatigue) {
            if (creep.getActiveBodyparts(MOVE)) {
                return false;
            } else {
                return true;
            }
        }
        if (creep.memory.path && creep.memory.path?.length > 0) {
            if (this.stuckHandler(creep)) {
                // Arrived condition
                if (creep.memory.path.length === 1) {
                    creep.move(creep.memory.path[0].direction);
                    creep.memory.path = null;
                    creep.memory.repairWhileMove = null;
                    return true;
                } else {
                    // We still have traveling to do.
                    creep.move(creep.memory.path[0].direction);
                    if (creep.memory.repairWhileMove) {
                        this.repairRoad(creep);
                    }
                    return false;
                }
            }
        }
        return true;
    }

    private stuckHandler(creep: Creep): boolean {
        const lastPos = _.first(creep.memory.path);
        if (lastPos!.x != creep.pos.x || lastPos!.y != creep.pos.y) {
            if (creep.memory.stuckCount) creep.memory.stuckCount += 1;
            else creep.memory.stuckCount = 1;
            if (creep.memory.stuckCount === 2) {
                if (this.fixStuck(creep)) {
                    return true;
                } else {
                    return false;
                }
            } else if (creep.memory.stuckCount > 2) {
                this.cleanUpPath(creep);
                return false;
            }
        } else {
            creep.memory.stuckCount = 0;
            creep.memory.path = _.tail(creep.memory.path);
        }
        return true;
    }

    protected cleanUpPath(creep: Creep) {
        delete creep.memory.path;
        creep.memory.stuckCount = 0;
        if (creep.memory.role === CreepRole.scout && creep.memory.orders && creep.memory.orders.independentOperator) {
            creep.memory.orders.target = "";
        }
    }

    private fixStuck(creep: Creep): boolean {
        const currentPathStep = _.first(creep.memory.path);
        if (currentPathStep) {
            const blockers = creep.room.lookForAt(LOOK_CREEPS, currentPathStep.x, currentPathStep.y);
            if (blockers.length > 0) {
                const blocker = _.first(blockers);
                if (blocker) {
                    if (
                        blocker.fatigue ||
                        !blocker.getActiveBodyparts(MOVE) ||
                        blocker.memory.taxi ||
                        blocker.memory.activeTaxi
                    ) {
                        return this.pathingOvertake(creep);
                    } else {
                        blocker.moveTo(creep.pos.x, creep.pos.y);
                        if (blocker.memory) {
                            blocker.memory.moved = true;
                            return true;
                        } else {
                            this.cleanUpPath(creep);
                            return false;
                        }
                    }
                } else {
                    this.cleanUpPath(creep);
                    return false;
                }
            }
        }
        return false;
    }

    private pathingOvertake(creep: Creep): boolean {
        if (creep.memory.path && creep.memory.path.length >= 3) {
            const routeToPathStep = creep.memory.path[2];
            if (routeToPathStep) {
                const routeToPos = new RoomPosition(routeToPathStep.x, routeToPathStep.y, creep.room.name);
                const bypassPath = creep.pos.findPathTo(routeToPos, { ignoreCreeps: false });
                if (bypassPath) {
                    creep.memory.path = _.concat(bypassPath, _.drop(creep.memory.path, 3));
                    return true;
                }
            }
        } else {
            this.cleanUpPath(creep);
        }
        // TODO Add other overtake options
        return false;
    }

    //* Work Tasks
    // This intentionally tries to upgrade first. Upgrading is generally done by upgraders, and they are usually in range.
    protected upgradeController(creep: Creep, taxi?: boolean): boolean {
        const target = creep.room.controller;
        if (target) {
            if (creep.upgradeController(target) === ERR_NOT_IN_RANGE) {
                if (taxi) {
                    return false;
                } else {
                    creep.moveTo(target, { visualizePathStyle: { stroke: "#AE02E6", strokeWidth: 0.15 } });
                }
                return true;
            } else {
                return true;
            }
        }
        return false;
    }

    construct(creep: Creep): boolean {
        const target = ConstructionSiteCacher.getConstructionSiteRoom(creep.room);
        if (target) {
            if (creep.pos.isNearTo(target)) {
                creep.build(target);
                return true;
            } else {
                creep.moveTo(target, { reusePath: 10, ignoreCreeps: false });
                return true;
            }
        }
        return false;
    }

    // Checks to see if in range to havest from a source
    protected harvestPrecious(creep: Creep): number {
        if (creep.memory.precious) {
            const harvestTarget: Source | Mineral | Deposit | null = Game.getObjectById(creep.memory.precious);
            if (harvestTarget) {
                return creep.harvest(harvestTarget);
            }
        }
        return 0;
    }
}
