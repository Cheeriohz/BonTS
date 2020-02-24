import { RoleRemote } from "./role.remote";

export class RoleSquad extends RoleRemote {
    protected deployment(creep: Creep) {
        const squad = Memory.squads[creep.memory.squad!];
        if (squad) {
            if (creep.pos.isNearTo(squad.pos[0], squad.pos[1])) {
                creep.memory.working = true;
                squad.enlistees.push(creep.name);
            } else {
                this.travelByCachedPath(false, creep, creep.pos.findPathTo(squad.pos[0], squad.pos[1]));
            }
        }
    }
}
