export class towerManager {
    public static run() {
        for (const room in Game.rooms) {
            for (const tower of Game.rooms[room].find<StructureTower>(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_TOWER)
                }
            })) {
                this.handleTower(tower);
            }
        }
    }

    private static handleTower(tower: StructureTower) {
        let enemies = tower.room.find(FIND_HOSTILE_CREEPS);
        if (enemies.length > 0) {
            enemies.sort((a, b) => a.hits - b.hits);
            tower.attack(enemies[0]);
        }
        else {
            if (tower.energy > 200) {
                this.repairDamage(tower);
            }
        }
    }

    private static repairDamage(tower: StructureTower): boolean {
        const damagedStructures = tower.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return (structure.hits < structure.hitsMax)
            }
        });

        if (damagedStructures.length > 0) {
            if (tower.repair(damagedStructures[0]) == ERR_NOT_IN_RANGE) {
                console.log("hmm range issue?");

            }
            else {
                return true;
            }
        }
        return false;
    }

}
