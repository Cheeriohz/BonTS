import { RoleRemote } from "roleDefinitions/base/role.remote";

export class RoleRemoteReserver extends RoleRemote {
    public Run(creep: Creep) {
        if (creep.memory.working) {
            creep.reserveController(creep.room.controller!);
        } else {
            this.Pilgrimage(creep);
        }
    }

    private Pilgrimage(creep: Creep) {
        if (creep.memory.dedication === creep.room.name) {
            this.travelToRoom(creep, creep.memory.dedication, false);
        } else {
            if (creep.pos.isNearTo(creep.room.controller!)) {
                creep.memory.working = true;
            } else {
                creep.moveTo(creep.room.controller!, { ignoreCreeps: false, reusePath: 50 });
            }
        }
    }
}
