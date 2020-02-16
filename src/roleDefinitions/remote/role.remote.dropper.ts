import { RoleRemote } from "roleDefinitions/base/role.remote";
import { profile } from "Profiler";
import _ from "lodash";

@profile
export class RoleRemoteDropper extends RoleRemote {
    public runRemote(creep: Creep) {
        if (creep.memory.working) {
            creep.memory.tick = (creep.memory.tick ?? 0) + 1;
            if (creep.memory.tick! > 5) {
                creep.memory.tick = 0;
                const container: Structure | null = Game.getObjectById(creep.memory.dedication!);
                if (container) {
                    if (creep.store.getUsedCapacity() === 0) {
                        creep.withdraw(container, RESOURCE_ENERGY);
                    }
                    if (container.hitsMax - container.hits > 100) {
                        creep.repair(container);
                        return;
                    }
                }
                const containerSite = creep.pos.lookFor(LOOK_CONSTRUCTION_SITES);
                if (containerSite && containerSite.length > 0) {
                    creep.build(_.first(containerSite)!);
                    return;
                }
            }
            super.harvestPrecious(creep);
        } else {
            this.dedicatedContainerRelocateRemote(creep, creep.memory.dedication!, creep.memory.orders!.target);
            return;
        }
    }
}
