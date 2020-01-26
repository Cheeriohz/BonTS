import { RoleCreep } from "./base/role.creep";
export class RoleBuilder extends RoleCreep {
    private maxRepairThreshold: number = 1000000

    public run(creep: Creep) {
        const currentEnergy = creep.store[RESOURCE_ENERGY]

        if (creep.memory.working && currentEnergy === 0) {
            creep.memory.working = false;
            creep.say('🔄 harvest');
        }
        if (!creep.memory.working && creep.store.getFreeCapacity() === 0) {
            creep.memory.working = true;
            creep.say('🚧 build');
            creep.say("🔧 Repair");
        }

        if (creep.memory.working) {
            if (!(this.construct(creep))) {
                this.repair(creep);
            }
        }
        else {
            this.fillUp(creep);
        }
    }

    private repair(creep: Creep) {
        if (creep.memory.precious) {
            const repairTarget: Structure | null = Game.getObjectById(creep.memory.precious);
            if (repairTarget && repairTarget.hits !== this.maxRepairThreshold && repairTarget.hits !== repairTarget.hitsMax) {
                this.repairMove(creep, repairTarget);
            }
            else {
                creep.memory.precious = null;
                this.repair(creep);
                return;
            }
        }
        else {
            this.getRepairTarget(creep);
        }

    }

    private getRepairTarget(creep: Creep) {
        const targets = creep.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return (structure.hits < structure.hitsMax && structure.hits < this.maxRepairThreshold)
            }
        });
        if (targets.length > 0) {
            creep.memory.precious = targets[0].id;
            this.repair(creep);
            return;
        }
        else {
            this.upgradeController(creep);
        }
    }
};
