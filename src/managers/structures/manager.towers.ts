import _ from "lodash";

export class TowerManager {
    private static priorityStructures: StructureConstant[] = [STRUCTURE_CONTAINER, STRUCTURE_ROAD];
    public static run() {
        for (const room in Game.rooms) {
            for (const tower of Game.rooms[room].find<StructureTower>(FIND_STRUCTURES, {
                filter: structure => {
                    return structure.structureType === STRUCTURE_TOWER;
                }
            })) {
                this.handleTower(tower);
            }
        }
    }

    private static handleTower(tower: StructureTower) {
        if (tower.room.memory.target) {
            this.attackId(tower, tower.room.memory.target);
        } else if (!this.identifyPrimeTarget(tower)) {
            if (tower.energy > 200) {
                if (!this.repairImportant(tower)) {
                    this.healCreeps(tower);
                    // this.repairAny(tower);
                }
            }
        }
    }

    private static healCreeps(tower: StructureTower) {
        const woundedCreep = tower.pos.findClosestByRange(FIND_MY_CREEPS, {
            filter: c => c.hits != c.hitsMax
        });
        if (woundedCreep) {
            tower.heal(woundedCreep);
        }
    }

    private static identifyPrimeTarget(tower: StructureTower): boolean {
        const enemies: Creep[] | null = tower.room.find(FIND_HOSTILE_CREEPS);
        if (enemies && enemies.length > 1) {
            tower.room.memory.target = this.towerAttackPrioritize(enemies);
            if (tower.room.memory.target) {
                this.attackId(tower, tower.room.memory.target);
                return true;
            } else {
                tower.room.memory.target = _.first(enemies)!.id;
                this.attackId(tower, tower.room.memory.target);
                return true;
            }
        } else if (enemies && enemies.length === 1) {
            tower.room.memory.target = enemies[0].id;
            this.attackId(tower, enemies[0].id);
            return true;
        }
        return false;
    }

    private static towerAttackPrioritize(creeps: Creep[]): Id<Creep> | undefined {
        return _.last(_.sortBy(creeps, c => this.getPriorityForCreep(c)))?.id;
    }

    private static getPriorityForCreep(creep: Creep): number {
        if (creep.getActiveBodyparts(HEAL)) {
            return 10;
        } else if (creep.getActiveBodyparts(RANGED_ATTACK)) {
            return 8;
        } else if (creep.getActiveBodyparts(WORK)) {
            return 6;
        } else if (creep.getActiveBodyparts(ATTACK)) {
            return 4;
        }
        return 1;
    }

    private static attackId(tower: StructureTower, id: string) {
        const target: Creep | null = Game.getObjectById(id);
        if (target && target.room.name === tower.room.name) {
            tower.attack(target);
        } else {
            tower.room.memory.target = null;
        }
    }

    private static repairImportant(tower: StructureTower): boolean {
        const damagedStructures = tower.room.find(FIND_STRUCTURES, {
            filter: structure => {
                return (
                    structure.hits < structure.hitsMax &&
                    TowerManager.priorityStructures.includes(structure.structureType)
                );
            }
        });

        if (damagedStructures.length > 0) {
            tower.repair(damagedStructures[0]);
            return true;
        }
        return false;
    }

    private static repairAny(tower: StructureTower): boolean {
        const damagedStructures = tower.room.find(FIND_STRUCTURES, {
            filter: structure => {
                return structure.hits < structure.hitsMax;
            }
        });

        if (damagedStructures.length > 0) {
            tower.repair(damagedStructures[0]);
            return true;
        }
        return false;
    }
}
