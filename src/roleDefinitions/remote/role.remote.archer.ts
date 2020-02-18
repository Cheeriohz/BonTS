import { RoleRemote } from "roleDefinitions/base/role.remote";
import _ from "lodash";

export class RoleRemoteArcher extends RoleRemote {
    public runRemote(creep: Creep) {
        if (!creep.memory.working && creep.room.name === creep.memory.orders!.target) {
            creep.memory.working = true;
            creep.say("🏹");
        }

        this.checkHeal(creep);
        if (creep.memory.working) {
            if (creep.memory.orders && creep.room.name === creep.memory.orders.target) {
                this.checkLock(creep);
            } else {
                this.moveInToHarass(creep);
            }
            return;
        } else {
            this.moveInToHarass(creep);
            return;
        }
    }

    private moveInToHarass(creep: Creep) {
        this.travelToRoom(creep, creep.memory.orders!.target, false);
        this.leaveBorder(creep);
    }

    private checkLock(creep: Creep) {
        if (creep.memory.dedication) {
            const creepTarget: Creep | null = Game.getObjectById(creep.memory.dedication);
            if (creepTarget) {
                this.attackTarget(creep, creepTarget);
                return;
            } else {
                creep.memory.dedication = null;
                if (creep.memory.mrf) {
                    delete creep.memory.mrf;
                }
            }
        } else if (creep.memory.precious) {
            const structureTarget: Structure | null = Game.getObjectById(creep.memory.precious);
            if (structureTarget) {
                this.attackTarget(creep, structureTarget);
                return;
            } else {
                creep.memory.precious = null;
            }
        }
        this.findHarrass(creep);
    }

    private checkHeal(creep: Creep) {
        if (creep.hitsMax !== creep.hits) {
            creep.heal(creep);
        } else {
            const nearCreep: Creep[] | null = creep.pos.findInRange(FIND_MY_CREEPS, 3, {
                filter: c => {
                    return c.hits !== c.hitsMax;
                }
            });
            if (nearCreep) {
                creep.heal(nearCreep[0]);
            } else if (creep.memory.dedication) {
                // preheal
                creep.heal(creep);
            }
        }
        this.roomHeal(creep);
    }

    private roomHeal(creep: Creep) {
        creep.memory.tick = (creep.memory.tick ?? 0) + 1;
        if (creep.memory.tick! > 20) {
            creep.memory.tick = 0;
            const damagedCreeps = creep.room.find(FIND_MY_CREEPS, {
                filter: c => c.hits != c.hitsMax
            });
            if (damagedCreeps.length > 0) {
                creep.memory.heal = creep.id;
            }
        }
    }

    private findHarrass(creep: Creep) {
        const harassTargets: Creep[] = creep.room.find(FIND_HOSTILE_CREEPS);
        if (harassTargets && harassTargets.length > 0) {
            const harrassTarget: Creep | null = creep.pos.findClosestByPath(harassTargets);
            if (harrassTarget) {
                if (harrassTarget.getActiveBodyparts(ATTACK)) {
                    creep.memory.mrf = true;
                }
                creep.memory.dedication = harrassTarget.id;
                this.attackTarget(creep, harrassTarget);
                return;
            }
        }
        const harrassStructures: Structure[] = creep.room.find(FIND_HOSTILE_STRUCTURES, {
            filter: s => {
                return (
                    s.structureType !== STRUCTURE_CONTROLLER &&
                    s.structureType !== STRUCTURE_POWER_BANK &&
                    s.structureType !== STRUCTURE_POWER_SPAWN
                );
            }
        });
        if (harrassStructures && harrassStructures.length > 0) {
            const harrassStructure: Structure | null = creep.pos.findClosestByPath(harrassStructures);
            if (harrassStructure) {
                creep.memory.precious = harrassStructure.id;
                this.attackTarget(creep, harrassStructure);
                return;
            }
        }
        if (this.stompConstruction(creep)) {
            return;
        }
        const wall: Structure | null = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: structure => {
                {
                    return structure.structureType === STRUCTURE_WALL && structure.hitsMax;
                }
            }
        });
        if (wall) {
            creep.memory.precious = null;
            creep.memory.dedication = null;
            this.attackTarget(creep, wall);
            return;
        }
        if (creep.memory.heal) {
            const healTarget: Creep | null = Game.getObjectById(creep.memory.heal);
            if (healTarget) {
                creep.moveTo(healTarget);
                return;
            }
        }
        creep.moveTo(25, 25);
    }

    private attackTarget(creep: Creep, victim: Creep | Structure) {
        if (victim) {
            const rangeToVictim = creep.pos.getRangeTo(victim);
            if (creep.memory.mrf && rangeToVictim < 4) {
                // Move away
                creep.move(this.oppositeDirection(creep.pos.getDirectionTo(victim)));
            } else if (rangeToVictim > 1) {
                creep.moveTo(victim.pos);
            }
            creep.rangedAttack(victim);
        }
    }

    private stompConstruction(creep: Creep): boolean {
        const constructionSite = creep.pos.findClosestByPath(FIND_HOSTILE_CONSTRUCTION_SITES);
        if (constructionSite) {
            creep.moveTo(constructionSite);
            return true;
        } else {
            return false;
        }
    }
}
