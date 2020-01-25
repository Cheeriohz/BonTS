import _ from "lodash";
import { getContainer } from "managers/caching/manager.containerSelector";
import { harvestSourceSmart } from "managers/caching/manager.sourceSelector";
import { profile } from "Profiler";
import { ControllerCacher } from "managers/caching/manager.controllerCacher";
import { ConstructionSiteCacher } from "managers/caching/manager.constructionSiteCacher";

@profile
export class RoleCreep {


    protected fillUp(creep: Creep) {
        const link = this.checkForNearbyLink(creep);
        if (link) {
            return this.withdrawMove(creep, link);
        }
        const storage = this.checkStorageForAvailableResource(creep.room, RESOURCE_ENERGY);
        if (storage) {
            return this.withdrawMove(creep, storage);
        }
        const container = Game.getObjectById<StructureContainer>(getContainer(creep));
        if (container) {
            return this.withdrawMove(creep, container);
        }
        return harvestSourceSmart(creep);
    }

    protected fillClosest(creep: Creep, ignoreLinks: boolean): boolean {
        if (!ignoreLinks) {
            const link = this.checkForLinktoFill(creep);
            if (link) {
                this.depositMove(creep, link);
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
        const storage = this.checkStorageForDeposit(creep.room)
        if (storage) {
            this.depositMove(creep, storage);
            return true;
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
        const storage = this.checkStorageForDeposit(creep.room)
        if (storage) {
            return this.depositMove(creep, storage);
        }
    }

    protected withdrawMove(creep: Creep, structure: Structure) {
        if (creep.pos.isNearTo(structure)) {
            creep.withdraw(structure, RESOURCE_ENERGY);
            return;
        }
        else {
            creep.moveTo(structure, { reusePath: 1000, ignoreCreeps: false });
            return;
        }
    }

    protected depositMove(creep: Creep, structure: Structure) {
        // console.log(JSON.stringify(structure));
        if (creep.pos.isNearTo(structure)) {
            creep.transfer(structure, RESOURCE_ENERGY);
            return;
        }
        else {
            creep.moveTo(structure, { reusePath: 1000, ignoreCreeps: false });
            return;
        }
    }

    protected checkStorageForAvailableResource(room: Room, resourceType: ResourceConstant): StructureStorage | undefined {
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

    protected findFillableStructure(creep: Creep, findType: STRUCTURE_LINK | STRUCTURE_STORAGE | STRUCTURE_SPAWN | STRUCTURE_EXTENSION | STRUCTURE_TOWER): Structure | null {
        const queryItem: Structure | null = creep.pos.findClosestByRange(FIND_STRUCTURES,
            { filter: (structure) => { structure.structureType === findType && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0 } });
        return queryItem
    }

    protected findClosestFillableStructure(creep: Creep): Structure | null {
        const queryItem: Structure | null = creep.pos.findClosestByRange(FIND_STRUCTURES,
            {
                filter: (structure) => {
                    return (structure.structureType === STRUCTURE_EXTENSION ||
                        structure.structureType === STRUCTURE_SPAWN ||
                        structure.structureType === STRUCTURE_TOWER) && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                }
            });
        // console.log(JSON.stringify(queryItem));
        return queryItem
    }

    protected findClosestFillableRespawnStructure(creep: Creep): Structure | null {
        const queryItem: Structure | null = creep.pos.findClosestByRange(FIND_STRUCTURES,
            {
                filter: (structure) => {
                    return (structure.structureType === STRUCTURE_EXTENSION ||
                        structure.structureType === STRUCTURE_SPAWN) && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 49;
                }
            });
        return queryItem
    }

    // Ultimately, this looks worthless without further caching and subset breakout
    protected findHighestPriorityFillableStructure(creep: Creep): Structure | null {
        const queryItems: Structure[] = creep.room.find(FIND_STRUCTURES,
            {
                filter: (structure) => {
                    return (structure.structureType === STRUCTURE_EXTENSION ||
                        structure.structureType === STRUCTURE_SPAWN ||
                        structure.structureType === STRUCTURE_TOWER) && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                }
            });
        return _.sortBy(queryItems, (item) => this.fillOrder(creep.pos, item))[0];
    }

    protected fillOrder(pos: RoomPosition, structure: Structure): number {
        switch (structure.structureType) {
            case (STRUCTURE_EXTENSION): {
                return 0 + pos.getRangeTo(structure);
            }
            case (STRUCTURE_SPAWN): {
                return 50 + pos.getRangeTo(structure);
            }
            case (STRUCTURE_TOWER): {
                return 100 + pos.getRangeTo(structure);
            }
            default: {
                return 150;
            }
        }
    }

    protected checkForNearbyLink(creep: Creep): StructureLink | null {
        if (creep.room.memory.dumpLinks) {
            const links: StructureLink[] = _.compact(_.map(creep.room.memory?.dumpLinks, (id) => { return this.checkLinkForEnergy(id); }));
            if (links.length > 0) {
                const queryItem: StructureLink | null = creep.pos.findInRange<StructureLink>(links, 3)[0];
                return queryItem;
            }
        }
        return null
    }

    private checkLinkForEnergy(id: Id<StructureLink>): StructureLink | null {
        const link = Game.getObjectById(id);
        if (link && link.store.energy > 50) {
            return link;
        }
        else {
            return null;
        }
    }

    private checkLinkForFillable(id: Id<StructureLink>): StructureLink | null {
        const link = Game.getObjectById(id);
        if (link && link.store.energy < 700) {
            return link;
        }
        else {
            return null;
        }
    }

    protected checkForLinktoFill(creep: Creep): StructureLink | null {
        if (creep.room.memory.sourceLinks) {
            const links: StructureLink[] = _.compact(_.map(creep.room.memory?.sourceLinks, (id) => { return this.checkLinkForFillable(id); }));
            if (links.length > 0) {
                const queryItem: StructureLink | null = creep.pos.findInRange<StructureLink>(links, 3)[0];
                return queryItem;
            }
        }
        return null
    }

    // This intentionally tries to upgrade first. Upgrading is generally done by upgraders, and they are usually in range.
    protected upgradeController(creep: Creep): boolean {
        const target = ControllerCacher.getcontrollerRoom(creep.room);
        if (target) {
            if (creep.upgradeController(target) === ERR_NOT_IN_RANGE) {
                creep.moveTo(target, { visualizePathStyle: { stroke: '#AE02E6', strokeWidth: .15 } });
                return true;
            }
            else {
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
            }
            else {
                creep.moveTo(target, { reusePath: 1000, ignoreCreeps: false });
                return true;
            }
        }
        return false;
    }
}
