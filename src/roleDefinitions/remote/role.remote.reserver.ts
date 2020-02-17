import { RoleRemote } from "roleDefinitions/base/role.remote";
import { profile } from "Profiler";

@profile
export class RoleRemoteReserver extends RoleRemote {
    public runRemote(creep: Creep) {
        if (creep.memory.working) {
            this.manageControllerWork(creep, <ReserverOrder>creep.memory.orders);
        } else {
            this.Pilgrimage(creep);
        }
    }

    private manageControllerWork(creep: Creep, orders: ReserverOrder) {
        if (orders.reserving) {
            creep.reserveController(creep.room.controller!);
        } else if (orders.downgrading) {
            creep.attackController(creep.room.controller!);
        } else if (orders.claiming) {
            creep.claimController(creep.room.controller!);
        } else {
            console.log("Missed a specific assignment for a reserver");
            creep.reserveController(creep.room.controller!);
        }
    }

    private Pilgrimage(creep: Creep) {
        if (creep.memory.dedication !== creep.room.name) {
            console.log(`${creep.name} is traveling to ${creep.memory.dedication!}`);
            const controllerRoom: Room | null = Game.rooms[creep.memory.dedication!];
            if (controllerRoom) {
                this.cachedTravel(controllerRoom.controller!.pos, creep, false);
            } else {
                this.travelToRoom(creep, creep.memory.dedication!, false);
            }
            return;
        } else {
            if (creep.pos.isNearTo(creep.room.controller!)) {
                creep.memory.working = true;
                return;
            } else {
                console.log(`${creep.name} is handling path`);
                this.cachedTravel(creep.room.controller!.pos, creep, false);
                //creep.memory.path = creep.pos.findPathTo(creep.room.controller!, { ignoreCreeps: true });
                //this.pathHandling(creep);
                //creep.moveTo(creep.room.controller!, { ignoreCreeps: false, reusePath: 50 });
                return;
            }
        }
    }
}
