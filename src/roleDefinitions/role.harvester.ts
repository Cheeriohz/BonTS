import { harvestSourceSmart } from "../managers/caching/manager.sourceSelector"
import { RoleCreep } from "./base/role.creep";

export class RoleHarvester extends RoleCreep {

    public run(creep: Creep) {
        // determine nearest source and harvest energy
        if (creep.store.getFreeCapacity() > 0) {
            harvestSourceSmart(creep);
        }
        // energy full, time to find deposit location.
        else {
            if (!this.fillClosest(creep)) {
                if (!this.construct(creep)) {
                    this.upgradeController(creep);
                }
            }
        }
    }
};
