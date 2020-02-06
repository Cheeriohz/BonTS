import { RoleRemote } from "roleDefinitions/base/role.remote";

export class RoleRemoteBuilder extends RoleRemote {
    public runRemote(creep: Creep) {
        const currentEnergy = creep.store[RESOURCE_ENERGY];
        if (creep.memory.working && currentEnergy === 0) {
            creep.memory.working = false;
            creep.say("🔄 harvest");
            //this.testRemoteDispatchR(creep)
            //return;
        }
        if (!creep.memory.working && creep.store.getFreeCapacity() === 0) {
            creep.memory.working = true;
            creep.say("🚧 build");
            //this.testRemoteDispatch(creep);
            //return;
        }

        if (creep.memory.working) {
            this.constructRemote(creep, creep.memory.dedication!, true);
            return;
        } else {
            this.fillUpAtHome(creep);
            return;
        }
    }
}
