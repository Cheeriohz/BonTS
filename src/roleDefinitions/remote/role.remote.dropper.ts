import { RoleRemote } from "roleDefinitions/base/role.remote";

export class RoleRemoteDropper extends RoleRemote {
    public run(creep: Creep) {
        if (creep.memory.working) {
            super.harvestPrecious(creep);
        }
        else {
            this.dedicatedContainerRelocateRemote(creep, creep.memory.dedication!, creep.memory.orders!.target);
        }
    }
}

