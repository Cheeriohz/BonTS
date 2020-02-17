import { RoleRemote } from "roleDefinitions/base/role.remote";

export class RoleRemoteBuilder extends RoleRemote {
    public runRemote(creep: Creep) {
        const currentEnergy = creep.store[RESOURCE_ENERGY];
        if (creep.memory.working && currentEnergy === 0) {
            creep.memory.working = false;
            if (!creep.memory.precious) {
                const localSources = creep.room.find(FIND_SOURCES, {
                    filter: s => s.pos.findInRange(FIND_STRUCTURES, 1).length === 0
                });
                if (localSources.length > 0) {
                    const closestSource = creep.pos.findClosestByPath(localSources);
                    if (closestSource) {
                        creep.memory.precious = closestSource.id;
                    }
                }
            }

            creep.say("🔄 harvest");
        }
        if (!creep.memory.working && creep.store.getFreeCapacity() === 0) {
            creep.memory.working = true;
            creep.say("🚧 build");
        }

        if (creep.memory.working) {
            this.constructRemote(creep, creep.memory.dedication!, true);
            return;
        } else {
            if (creep.memory.precious) {
                this.harvestMove(creep, creep.memory.precious);
            } else {
                this.fillUpAtHome(creep);
            }
            return;
        }
    }
}
