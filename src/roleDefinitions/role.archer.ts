import { RoleRemote } from "roleDefinitions/base/role.remote";
import _ from "lodash";
import { RoleCreep } from "./base/role.creep";

export class RoleArcher extends RoleCreep {
    public run(creep: Creep) {
        if(creep.memory.dedication === null) {
			creep.memory.dedication
		}
        if (!creep.memory.working && creep.room.name === creep.memory.orders!.target) {
            creep.memory.working = true;
            creep.say("");
        }
    }

    private disrupt(creep: Creep) {
        //this.checkLock(creep);

        this.checkHeal(creep);
        if ((creep.hits + 1) / creep.hitsMax < 0.5) {
            this.flee(creep);
        }
    }

    private attackNear(creep: Creep) {
        const creepNear: Creep[] | null = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 3);
        if (creepNear && creepNear.length > 1) {
            this.attackTarget(creep, _.first(creepNear)!);
        }
    }

    private checkLock(creep: Creep) {
        if (creep.memory.dedication) {
            const creepTarget: Creep | null = Game.getObjectById(creep.memory.dedication);
            if (creepTarget) {
                this.attackTarget(creep, creepTarget);
            } else {
                creep.memory.dedication = null;
            }
        } else if (creep.memory.precious) {
            const structureTarget: Structure | null = Game.getObjectById(creep.memory.precious);
            if (structureTarget) {
                this.attackTarget(creep, structureTarget);
            } else {
                creep.memory.dedication = null;
            }
        } else {
            //this.checkHeal(creep);
            this.findHarrass(creep);
        }
    }

    private checkHeal(creep: Creep) {
        if (creep.hitsMax - creep.hits > creep.getActiveBodyparts(HEAL) * 12) {
            creep.heal(creep);
        }
    }

    private lockOn(creep: Creep) {
        const harassTargets: Creep[] = creep.room.find(FIND_HOSTILE_CREEPS);
        if (harassTargets && harassTargets.length > 0) {
            const harrassTarget: Creep | null = creep.pos.findClosestByPath(harassTargets);
            if (harrassTarget) {
                creep.memory.dedication = harrassTarget.id;
                this.attackTarget(creep, harrassTarget);
                return;
            }
        }
        const harrassStructures: Structure[] = creep.room.find(FIND_HOSTILE_STRUCTURES, {
            filter: s => s.structureType !== STRUCTURE_CONTROLLER
        });
        if (harrassStructures && harrassStructures.length > 0) {
            const harrassStructure: Structure | null = creep.pos.findClosestByPath(harrassStructures);
            if (harrassStructure) {
                creep.memory.precious = harrassStructure.id;
                this.attackTarget(creep, harrassStructure);
                return;
            }
        }
        const wall: Structure | null = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: structure => {
                {
                    return structure.structureType === STRUCTURE_WALL;
                }
            }
        });
        if (wall) {
            creep.memory.precious = wall.id;
            this.attackTarget(creep, wall);
            return;
        }
    }

    private attackTarget(creep: Creep, victim: Creep | Structure) {
        if (victim) {
            if (!creep.pos.isNearTo(victim)) {
                // Check if you can reach the target
                creep.moveTo(victim);
            }
            creep.attack(victim);
        }
    }

}
