export class TowerManager {
    private static priorityStructures: StructureConstant[] = [STRUCTURE_CONTAINER, STRUCTURE_ROAD, STRUCTURE_SPAWN, STRUCTURE_EXTENSION, STRUCTURE_LINK];
    public static run() {
        for (const room in Game.rooms) {
            for (const tower of Game.rooms[room].find<StructureTower>(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType === STRUCTURE_TOWER)
                }
            })) {
                this.handleTower(tower);
            }
        }
    }

    private static handleTower(tower: StructureTower) {
        const enemies = tower.room.find(FIND_HOSTILE_CREEPS);
        if (enemies.length > 0) {
            enemies.sort((a, b) => a.hits - b.hits);
            tower.attack(enemies[0]);
        }
        else {
            if (tower.energy > 200) {
                if (!this.repairImportant(tower)) {
                    // this.repairAny(tower);
                }
            }
        }
    }

    private static repairImportant(tower: StructureTower): boolean {
        const damagedStructures = tower.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return (structure.hits < structure.hitsMax && TowerManager.priorityStructures.includes(structure.structureType))
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
            filter: (structure) => {
                return (structure.hits < structure.hitsMax)
            }
        });

        if (damagedStructures.length > 0) {
            tower.repair(damagedStructures[0]);
            return true;
        }
        return false;
    }

}
