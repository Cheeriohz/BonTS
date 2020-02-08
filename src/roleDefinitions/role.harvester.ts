import { harvestSourceSmart } from "../caching/manager.sourceSelector";
import { RoleCreep } from "./base/role.creep";
import { CreepRole } from "enums/enum.roles";

export class RoleHarvester extends RoleCreep {
    public run(creep: Creep) {
        if (creep.memory.working && creep.store.getUsedCapacity() === 0) {
            creep.memory.working = false;
        } else if (!creep.memory.working && creep.store.getFreeCapacity() === 0) {
            creep.memory.working = true;
        }

        // determine nearest source and harvest energy
        if (creep.memory.working) {
            if (!this.fillClosest(creep, true)) {
                if (!this.construct(creep)) {
                    this.upgradeController(creep);
                }
            }
        }
        // energy full, time to find deposit location.
        else {
            harvestSourceSmart(creep);
            if (creep.room.memory.lowRCLBoost) {
                this.checkForAdjacentDroppedEnergy(creep);
            }
        }
    }
}
