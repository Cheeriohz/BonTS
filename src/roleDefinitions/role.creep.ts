import _ from "lodash";
import { getContainer } from "managers/manager.containerSelector";
import { harvestSourceSmart } from "managers/manager.sourceSelector";

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

    protected fillClosest(creep: Creep) {
        const link = this.checkForLinktoFill(creep);
        if (link) {
            return this.depositMove(creep, link);
        }
        const fillable = this.findClosestFillableRespawnStructure(creep);
        if (fillable) {
            return this.depositMove(creep, fillable);
        }
        const fillableOther = this.findClosestFillableStructure(creep);
        if (fillableOther) {
            return this.depositMove(creep, fillableOther);
        }
        const storage = this.checkStorageForDeposit(creep.room)
        if (storage) {
            return this.depositMove(creep, storage);
        }
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
                        structure.structureType === STRUCTURE_SPAWN) && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
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
        const queryItem: StructureLink | null = creep.pos.findInRange<StructureLink>(FIND_STRUCTURES, 3,
            { filter: (structure) => { return structure.structureType === STRUCTURE_LINK && structure.store.getUsedCapacity(RESOURCE_ENERGY) > 50; } })[0];
        return queryItem
    }

    protected checkForLinktoFill(creep: Creep): StructureLink | null {
        const link: StructureLink | null = creep.pos.findInRange<StructureLink>(FIND_STRUCTURES, 3,
            {
                filter: (structure) => {
                    return (structure.structureType === STRUCTURE_LINK && structure.store.getCapacity(RESOURCE_ENERGY) < 700);
                }
            })[0];
        return link
    }





}
