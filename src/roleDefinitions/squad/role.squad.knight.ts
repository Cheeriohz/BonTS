import { RoleSquad } from "roleDefinitions/base/role.squad";
import _ from "lodash";

export class RoleSquadKnight extends RoleSquad {
    public run(creep: Creep) {
        if (!creep.memory.working) {
            this.deployment(creep);
        }
        this.dailyDuty(creep);
    }

    private dailyDuty(creep: Creep) {
        if (creep.memory.precious) {
            const target: Creep | PowerCreep | Structure | null = Game.getObjectById(creep.memory.precious);
            if (target) {
                creep.attack(target);
                return;
            } else {
                creep.memory.precious = null;
            }
        }
    }
}
