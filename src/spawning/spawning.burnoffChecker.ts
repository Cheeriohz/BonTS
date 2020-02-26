import _ from "lodash";

import { CreepRole } from "enums/enum.roles";

export class BurnoffChecker {
    private room!: Room;
    private burnoffThreshold: number = 500000;

    constructor(room: Room) {
        this.room = room;
    }

    public CheckForBurnoff(): boolean {
        const storage = this.room.storage;
        if (storage) {
            if (storage.store.getUsedCapacity(RESOURCE_ENERGY) > this.burnoffThreshold) {
                this.ToggleBurnOn();
            } else {
                this.ToggleBurnOff();
            }
        }
        return false;
    }

    private ToggleBurnOn() {
        if (this.room.controller && this.room.controller.level != 8 && this.room.memory.roleTargets) {
            this.room.memory.roleTargets[CreepRole.upgrader] = 2;
        }
    }

    private ToggleBurnOff() {
        if (this.room.controller && this.room.controller.level != 8 && this.room.memory.roleTargets) {
            this.room.memory.roleTargets[CreepRole.upgrader] = 1;
        }
    }

    private AlreadyBurning() {
        if (this.room.controller && this.room.controller.level != 8) {
            if (Memory.roleRoomMap[this.room.name][CreepRole.upgrader] < 2) {
                if (!this.UpgraderRequested()) {
                    return true;
                }
            }
        }
        return false;
    }

    private UpgraderRequested() {
        for (const spawn of _.values(Game.spawns).filter(s => s.room.name === this.room.name)) {
            const creepRequest = _.filter(spawn.room.memory.creepRequest, cr => {
                return cr.role === CreepRole.upgrader;
            });
            if (creepRequest) {
                if (creepRequest.length > 0) {
                    return true;
                }
            }
        }
        return false;
    }
}
