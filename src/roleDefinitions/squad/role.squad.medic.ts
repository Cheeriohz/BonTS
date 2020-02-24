import { RoleSquad } from "roleDefinitions/base/role.squad";
import _ from "lodash";

export class RoleSquadMedic extends RoleSquad {
    public run(creep: Creep) {
        if (!creep.memory.working) {
            this.deployment(creep);
        }
        this.dailyDuty(creep);
    }

    private dailyDuty(creep: Creep) {
        if (creep.memory.heal) {
            const target: Creep | null = Game.getObjectById(creep.memory.heal);
            if (target) {
                creep.heal(target);
                return;
            } else {
                creep.memory.heal = null;
            }
        }
    }
}
