import { harvestSourceSmart } from "../caching/manager.sourceSelector";
import { RoleCreep } from "./base/role.creep";
import { TaxiServiceManager } from "managers/manager.taxiService";
export class RoleUpgrader extends RoleCreep {
    public run(creep: Creep) {
        const currentEnergy = creep.store[RESOURCE_ENERGY];

        if (creep.memory.working && currentEnergy === 0) {
            if (creep.room.memory.staticUpgraders) {
                if (creep.room.memory.linksActive) {
                    const link = this.checkForAdjacentLinkToRecharge(creep);
                    if (link) {
                        creep.withdraw(link, RESOURCE_ENERGY);
                    }
                }
                return;
            }
            creep.memory.working = false;
            if (creep.room.memory.lowRCLBoost) {
                if (this.idSpawnForWithdrawal(creep)) {
                    creep.say("🔋");
                } else {
                    creep.say("🔄");
                }
            } else {
                creep.say("🔄");
            }
        }
        if (!creep.memory.working && creep.store.getFreeCapacity() === 0) {
            if (creep.room.memory.upgraderTaxi) {
                TaxiServiceManager.requestTaxi(creep, creep.room.controller!.pos, 1, 3);
            }
            creep.memory.working = true;
            creep.say("⚡ upgrade");
        }

        if (creep.memory.working) {
            if (!this.upgradeController(creep, creep.room.memory.upgraderTaxi)) {
                if (creep.room.memory.upgraderTaxi) {
                    TaxiServiceManager.requestTaxi(creep, creep.room.controller!.pos, 1, 3);
                }
            }
        } else {
            if (creep.memory.precious) {
                if (this.safeSpawnWithdrawal(creep)) {
                    return;
                }
            }
            harvestSourceSmart(creep);
        }
    }
}
