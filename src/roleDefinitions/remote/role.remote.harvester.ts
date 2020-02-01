import { RoleRemote } from "roleDefinitions/base/role.remote";

export class RoleRemoteHarvester extends RoleRemote {
    public run(creep: Creep) {
        if (creep.memory.working && creep.store.getUsedCapacity() === 0) {
            creep.memory.working = false;
            creep.say("⛏️");
        } else if (!creep.memory.working && creep.store.getFreeCapacity() === 0) {
            creep.memory.working = true;
            creep.say("😓");
        }

        if (creep.memory.working) {
            if (!this.construct(creep)) {
                if (creep.room.name !== creep.memory.home) {
                    this.travelToRoom(creep, creep.memory.home!, true);
                    return;
                } else {
                    if (creep.room.storage) {
                        this.depositMoveSpecified(creep, creep.room.storage, <ResourceConstant>creep.memory.precious!);
                        return;
                    } else {
                        if (creep.memory.precious === RESOURCE_ENERGY) {
                            this.fillClosest(creep, true);
                        }
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
