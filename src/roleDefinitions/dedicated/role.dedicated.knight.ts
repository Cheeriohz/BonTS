import { RoleRemote } from "roleDefinitions/base/role.remote";
import _ from "lodash";

export class RoleDedicatedKnight extends RoleRemote {
    public runDedicated(creep: Creep) {
        if (!this.protect(creep)) {
            if (creep.memory.orders && creep.memory.orders.target !== creep.room.name) {
                //this.travelToRoom(creep, creep.memory.orders!.target, false, true);
                if (this.leaveBorder(creep)) {
                    this.cachedTravel(new RoomPosition(25, 25, creep.memory.orders!.target), creep, false, true);
                }
                return;
            } else {
                creep.moveTo(25, 25, { ignoreRoads: true });
                return;
            }
        }
        if (
            creep.memory.working &&
            creep.memory.precious === null &&
            creep.room.name === creep.memory.orders!.target &&
            creep.pos.isNearTo(25, 25)
        ) {
            creep.memory.working = false;
            creep.memory.orders!.independentOperator = true;
            creep.say("Patrol");
        }
    }

    private protect(creep: Creep): boolean {
        if (creep.memory.precious) {
            const creepTarget: Creep | Structure | null = Game.getObjectById(creep.memory.precious);
            if (creepTarget) {
                this.attackTarget(creep, creepTarget);
                return true;
            } else {
                creep.memory.precious = null;
                return this.vanquishEvil(creep);
            }
        } else {
            this.checkHeal(creep);
            return this.vanquishEvil(creep);
        }
    }

    private checkHeal(creep: Creep) {
        if (creep.hitsMax - creep.hits > creep.getActiveBodyparts(HEAL) * 12) {
            creep.heal(creep);
        }
    }

    private vanquishEvil(creep: Creep): boolean {
        if (creep.memory.orders!.target !== creep.room.name) {
            const harassTargets: Creep[] = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 10);
            if (harassTargets && harassTargets.length > 0) {
                this.chooseCreepTarget(creep, harassTargets);
            }
        } else {
            const harassTargets: Creep[] = creep.room.find(FIND_HOSTILE_CREEPS);
            if (harassTargets && harassTargets.length > 0) {
                this.chooseCreepTarget(creep, harassTargets);
            } else {
                const harrassStructures: Structure[] = creep.room.find(FIND_HOSTILE_STRUCTURES, {
                    filter: s => s.structureType !== STRUCTURE_CONTROLLER
                });
                if (harrassStructures && harrassStructures.length > 0) {
                    const harrassStructure: Structure | undefined = _.first(harrassStructures);
                    if (harrassStructure) {
                        creep.memory.precious = harrassStructure.id;
                        this.attackTarget(creep, harrassStructure);
                        return true;
                    }
                }
            }
        }

        return false;
    }

    private chooseCreepTarget(creep: Creep, targets: Creep[]): boolean {
        const target: Creep | null = creep.pos.findClosestByRange(targets);
        if (target) {
            creep.memory.precious = target.id;
            this.attackTarget(creep, target);
            return true;
        }
        return false;
    }

    private attackTarget(creep: Creep, victim: Creep | Structure) {
        if (victim) {
            if (!creep.pos.isNearTo(victim)) {
                creep.moveTo(victim);
            } else {
                if (victim.pos.x !== 49 && victim.pos.x !== 0 && victim.pos.y !== 49 && victim.pos.x !== 0) {
                    creep.move(creep.pos.getDirectionTo(victim));
                }
            }
            creep.attack(victim);
        }
    }
}
