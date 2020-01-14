//Enums
import { CreepRole } from "../enums/enum.roles"
import { RoomEra } from "../enums/enum.roomEra"

//Helpers
import { managerHelperSpawner } from "./helpers/manager.helper.spawner"

export class spawner {


    public static run() {
        const myRooms = Game.rooms;
        for (const room in myRooms) {
            //check to see if we can spawn.
            if (myRooms[room].memory.era == RoomEra.stone) {
                this.stoneSpawning(myRooms[room]);
            }
            else if (myRooms[room].memory.era == RoomEra.copper) {
                this.copperSpawning(myRooms[room]);
            }
        }

    }

    //Region eras
    private static stoneSpawning(room: Room) {
        if (managerHelperSpawner.canSpawn(room)) {
            if (this.spawnHarvesters(room, basicBody)) {
                if (this.spawnUpgraders(room, basicBody)) {
                    this.spawnBuilders(room, basicBody);
                }
            }
        }
    }

    private static copperSpawning(room: Room) {
        if (managerHelperSpawner.canSpawn(room)) {
            if (this.spawnHarvesters(room, basicBodyPlus)) {
                if (this.spawnUpgraders(room, basicBodyPlus)) {
                    this.spawnBuilders(room, basicBodyPlus);
                }
            }
        }
    }



    //Region spawn specific
    private static spawnHarvesters(room: Room, body: any[]) {
        const harvesters = managerHelperSpawner.getCreepsByType(room, CreepRole.harvester);

        if (harvesters.length < room.find(FIND_SOURCES).length + room.memory.era) {
            const spawns = room.find(FIND_MY_SPAWNS);

            if (spawns.length > 0) {
                managerHelperSpawner.spawnACreep(spawns[0], body, 'Harvester', CreepRole.harvester);
                return false;
            }
        }
        return true;
    }

    private static spawnUpgraders(room: Room, body: any[]) {
        const upgraders = managerHelperSpawner.getCreepsByType(room, CreepRole.upgrader);

        if (upgraders.length < (room.find(FIND_SOURCES).length * 3 - room.memory.era) - 1) { //TODO Figure out something better here
            const spawns = room.find(FIND_MY_SPAWNS);

            if (spawns.length > 0) {
                managerHelperSpawner.spawnACreep(spawns[0], body, 'Upgrader', CreepRole.upgrader);
                return false;
            }
        }
        return true;
    }

    private static spawnBuilders(room: Room, body: any[]) {
        const builders = managerHelperSpawner.getCreepsByType(room, CreepRole.builder);

        if (builders.length < 5) {
            const spawns = room.find(FIND_MY_SPAWNS);

            if (spawns.length > 0) {
                managerHelperSpawner.spawnACreep(spawns[0], body, 'Builder', CreepRole.builder);
                return false;
            }
        }
        return true;
    }
}

// Body Definitions
const basicBody = [WORK, CARRY, MOVE]; // 200 Energy
const basicBodyPlus = [WORK, WORK, CARRY, CARRY, MOVE, MOVE] // 400 Energy, for testing
const dropMinerBody = [WORK, WORK, WORK, WORK, WORK, MOVE]; // 550 Energy
const haulerBody = [CARRY, CARRY, CARRY, WORK, WORK, MOVE, MOVE, MOVE, MOVE] //550 Energy




