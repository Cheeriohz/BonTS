import { RoleRemote } from "roleDefinitions/base/role.remote";
import _ from "lodash";

// TODO Store nearby allies for efficiency or just add squads.
export class RoleRemoteKnight extends RoleRemote {
    public runRemote(creep: Creep) {
        if (!creep.memory.working && creep.room.name === creep.memory.orders!.target) {
            creep.memory.working = true;
            creep.say("⚔️");
        }

        if (creep.memory.working) {
            if ((creep.hits + 1) / creep.hitsMax < 0.7) {
                this.flee(creep);
            } else {
                if (creep.memory.hitsLast !== creep.hits) {
                    this.disrupt(creep);
                } else {
                    if (creep.memory.orders && creep.room.name === creep.memory.orders.target) {
                        this.checkLock(creep);
                    } else {
                        this.checkHeal(creep);
                        this.moveInToHarass(creep);
                    }
                }
            }

            creep.memory.hitsLast = creep.hits;
            return;
        } else {
            this.checkHeal(creep);
            this.moveInToHarass(creep);
            return;
        }
    }

    private disrupt(creep: Creep) {
        if (creep.hitsMax === creep.hits) {
            this.checkLock(creep);
        } else if (creep.memory.mrf) {
            this.checkLock(creep);
        } else {
            if (!this.handleRangedKiting(creep)) {
                this.attackNear(creep);
            }
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
        if (!this.findHarrass(creep)) {
            this.checkHeal(creep);
        }
    }

    private checkHeal(creep: Creep) {
        if (creep.hitsMax !== creep.hits) {
            creep.heal(creep);
        } else {
            const nearCreep: Creep | null = creep.pos.findClosestByRange(FIND_MY_CREEPS, {
                filter: c => {
                    return c.hits !== c.hitsMax;
                }
            });
            if (nearCreep && creep.pos.getRangeTo(nearCreep) < 4) {
                creep.heal(nearCreep);
            }
        }
    }

    private findHarrass(creep: Creep) {
		if(this.safeModeBlocking(creep)) {
			return;
		}
        const harassTargets: Creep[] = creep.room.find(FIND_HOSTILE_CREEPS);
        if (harassTargets && harassTargets.length > 0) {
            const harrassTarget: Creep | null = creep.pos.findClosestByPath(harassTargets);
            if (harrassTarget) {
                if (harrassTarget.getActiveBodyparts(RANGED_ATTACK)) {
                    const alliesNear = creep.pos.findInRange(FIND_MY_CREEPS, 5);
                    if (alliesNear.length < 2) {
                        creep.memory.mrf = true;
                    }
                }
                creep.memory.dedication = harrassTarget.id;
                return this.attackTarget(creep, harrassTarget);
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

                return this.attackTarget(creep, harrassStructure);
            }
        }
        if (this.stompConstruction(creep)) {
            return true;
        }
        const wall: Structure | null = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: structure => {
                {
                    return structure.structureType === STRUCTURE_WALL;
                }
            }
        });
        if (wall) {
            creep.memory.precious = null;
            creep.memory.dedication = null;
            return this.attackTarget(creep, wall);
        }
        creep.moveTo(25, 25);
        return false;
	}

	private safeModeBlocking(creep: Creep) {
		if(creep.room.controller && creep.room.controller.safeMode) {
			const sources = creep.room.find(FIND_SOURCES);
			const sourceTarget = _.first(_.sortBy(sources, (s) => s.pos.findInRange(FIND_CREEPS, 1).find.length));
			if(sourceTarget) {
				creep.memory.dedication = sourceTarget.id;
				creep.moveTo(sourceTarget);
				return true;
			}
		}
		return false;
	}

    private attackTarget(creep: Creep, victim: Creep | Structure): boolean {
        if (victim) {
            const rangeToVictim = creep.pos.getRangeTo(victim);
            if (creep.memory.mrf && (rangeToVictim === 3 || rangeToVictim === 2)) {
                // Move away
                creep.move(this.oppositeDirection(creep.pos.getDirectionTo(victim)));
                const alliesNear = creep.pos.findInRange(FIND_MY_CREEPS, 5);
                if (alliesNear.length > 1) {
                    creep.memory.mrf = false;
                }
                return false;
            } else if (rangeToVictim > 1) {
                // Check if you can reach the target
                creep.moveTo(victim.pos);
                return false;
            } else {
                if (victim.pos.x !== 49 && victim.pos.x !== 0 && victim.pos.y !== 49 && victim.pos.x !== 0) {
                    creep.move(creep.pos.getDirectionTo(victim));
                } else {
                    this.leaveBorder(creep);
                }
            }
            creep.attack(victim);
            return true;
        }
        return false;
    }

    private attackNear(creep: Creep): boolean {
        const creepNear: Creep[] | null = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 1);
        if (creepNear && creepNear.length > 1) {
            this.attackTarget(creep, _.first(creepNear)!);
            return true;
        }
        return false;
    }

    private flee(creep: Creep) {
        if (creep.memory.orders && creep.room.name === creep.memory.orders.target) {
            const escape = creep.pos.findClosestByPath(FIND_EXIT);
            if (escape) {
                creep.moveTo(escape);
                this.checkHeal(creep);
            }
        } else {
            this.leaveBorder(creep);
            if (creep.hits === creep.hitsMax) {
                this.moveInToHarass(creep);
            } else {
                if (!this.handleRangedKiting(creep)) {
                    if (!this.attackNear(creep)) {
                        this.checkHeal(creep);
                    }
                }
            }
        }
    }

    private handleRangedKiting(creep: Creep): boolean {
        const hostileRanged = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
            filter: c => {
                return c.getActiveBodyparts(RANGED_ATTACK) > 0;
            }
        });
        if (hostileRanged) {
            const alliesNear = creep.pos.findInRange(FIND_MY_CREEPS, 5);
            if (alliesNear.length < 2) {
                creep.memory.mrf = true;
            }
            creep.memory.dedication = hostileRanged.id;
            return this.attackTarget(creep, hostileRanged);
        }
        return false;
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
