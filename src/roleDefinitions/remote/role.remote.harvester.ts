import { RoleRemote } from "roleDefinitions/base/role.remote";

export class RoleRemoteHarvester extends RoleRemote {
    public run(creep: Creep) {
        if (creep.memory.working && creep.store.getUsedCapacity() === 0) {
            creep.memory.working = false;
            creep.say("⛏️ harvest");
        } else if (!creep.memory.working && creep.store.getFreeCapacity() === 0) {
            creep.memory.working = true;
            creep.say("😓 work");
        }

        if (creep.memory.working) {
            if (!this.construct(creep)) {
                if (creep.room.name !== creep.memory.home) {
                    this.travelToRoom(creep, creep.memory.home!, true);
                    return;
                } else {
                    if (creep.room.storage) {
                        this.depositMove(creep, creep.room.storage);
                        return;
                    } else {
                        this.fillClosest(creep, true);
                        return;
                    }
                }
            }
        } else {
            this.harvestRemote(creep, creep.memory.orders!.target, creep.memory.dedication!);
            return;
        }
    }
}
