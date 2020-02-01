import { RoleRemote } from "roleDefinitions/base/role.remote";
import { profile } from "Profiler";

@profile
export class RoleRemoteDropper extends RoleRemote {
    public runRemote(creep: Creep) {
        if (creep.memory.working) {
            if (super.harvestPrecious(creep) === ERR_NOT_ENOUGH_RESOURCES) {
                const container: Structure | null = Game.getObjectById(creep.memory.dedication!);
                if (container) {
                    if (creep.store.getUsedCapacity() === 0) {
                        creep.withdraw(container, RESOURCE_ENERGY);
                    }
                    if (container.hitsMax - container.hits > 100) {
                        creep.repair(container);
                    }
                }
            }
        } else {
            this.dedicatedContainerRelocateRemote(creep, creep.memory.dedication!, creep.memory.orders!.target);
            return;
        }
    }
}
