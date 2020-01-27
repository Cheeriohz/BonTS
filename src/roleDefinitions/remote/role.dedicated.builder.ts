
import { RoleRemote } from "roleDefinitions/base/role.remote";


// I am debating whether or not to use this moment to branch out into a remote subclass, but for not I am not sure if it's necessary.
export class RoleRemoteBuilder extends RoleRemote {

    public run(creep: Creep) {
        super.run(creep);
        const currentEnergy = creep.store[RESOURCE_ENERGY]
        if (creep.memory.working && currentEnergy === 0) {
            creep.memory.working = false;
            creep.say('🔄 harvest');
        }
        if (!creep.memory.working && creep.store.getFreeCapacity() === 0) {
            creep.memory.working = true;
            creep.say('🚧 build');
        }

        if (creep.memory.working) {
            this.constructRemote(creep, creep.memory.dedication!);
        }
        else {
            this.fillUpAtHome(creep);
        }
    }
};
