import { RoleCreep } from "./base/role.creep";
export class RoleBuilder extends RoleCreep {
    private maxRepairThreshold: number = 2000000;

    public run(creep: Creep) {
        const currentEnergy = creep.store[RESOURCE_ENERGY];

        if (creep.memory.working && creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
            creep.memory.working = false;
            //TODO remove
            this.checkForAdjacentDroppedEnergy(creep);
            creep.say("🔋 recharge");
        }
        if (!creep.memory.working && creep.store.getFreeCapacity() === 0) {
            creep.memory.working = true;
            creep.memory.precious = null;
            creep.say("🔧 Repair");
        }

        if (creep.memory.working) {
            this.repair(creep);
        } else {
            this.fillUp(creep);
        }
    }

    private repair(creep: Creep) {
        if (creep.memory.repair) {
            const repairTarget: Structure | null = Game.getObjectById(creep.memory.repair);
            if (
                repairTarget &&
                repairTarget.hits !== this.maxRepairThreshold &&
                repairTarget.hits !== repairTarget.hitsMax
            ) {
                this.repairMove(creep, repairTarget);
            } else {
                creep.memory.repair = null;
                this.repair(creep);
                return;
            }
        } else {
            this.getRepairTarget(creep);
        }
    }

    private getRepairTarget(creep: Creep) {
        const targets = creep.room.find(FIND_STRUCTURES, {
            filter: structure => {
                return (
                    structure.structureType !== STRUCTURE_ROAD &&
                    structure.structureType !== STRUCTURE_WALL &&
                    structure.hits < structure.hitsMax &&
                    structure.hits < this.maxRepairThreshold
                );
            }
        });
        if (targets.length > 0) {
            creep.memory.repair = targets[0].id;
            this.repair(creep);
            return;
        } else {
            this.checkForRoadsInUrgentNeed(creep);
        }
    }

    private checkForRoadsInUrgentNeed(creep: Creep) {
        const targets = creep.room.find(FIND_STRUCTURES, {
            filter: structure => {
                return structure.structureType === STRUCTURE_ROAD && structure.hits < 2000;
            }
        });
        if (targets.length > 0) {
            creep.memory.repair = targets[0].id;
            this.repair(creep);
            return;
        } else {
            if (!this.construct(creep)) {
                this.checkForWallsThatCouldUsePatching(creep);
            }
        }
    }

    private checkForWallsThatCouldUsePatching(creep: Creep) {
        const targets = creep.room.find(FIND_STRUCTURES, {
            filter: structure => {
                return structure.structureType === STRUCTURE_WALL && structure.hits < this.maxRepairThreshold;
            }
        });
        if (targets.length > 0) {
            creep.memory.repair = targets[0].id;
            this.repair(creep);
            return;
        } else {
            this.upgradeController(creep);
        }
    }
}
