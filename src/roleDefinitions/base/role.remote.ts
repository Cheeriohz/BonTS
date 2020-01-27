import { RoleCreep } from "./role.creep";

export class RoleRemote extends RoleCreep {

    protected run(creep: Creep) {
        if (!creep.memory.home) {
            creep.memory.home = creep.room.name;
        }
    }


    protected travelToRoomByCachedPath(creep: Creep, roomName: string, cachedPath: PathStep[]) {
        throw "I Haven't implemented this yet.";
    }

    // TODO implement some form of caching here. These searches are pretty expensive iirc.
    protected travelToRoom(creep: Creep, roomName: string) {
        let target = Game.map.findExit(creep.room.name, roomName);
        if (target > 0) {
            const destination = creep.pos.findClosestByPath(<ExitConstant>target);
            if (destination) {
                creep.moveTo(destination, {
                    reusePath: 1500, ignoreCreeps: true
                });
            }
        }
    }

    protected fillUpAtHome(creep: Creep) {
        if (creep.room.name === creep.memory.home) {
            this.fillUp(creep);
        }
        else {
            this.travelToRoom(creep, creep.memory.home!);
        }
    }

    protected constructRemote(creep: Creep, constructRoom: string) {
        if (creep.room.name === constructRoom) {
            this.construct(creep);
        }
        else {
            this.travelToRoom(creep, constructRoom);
        }
    }

}
