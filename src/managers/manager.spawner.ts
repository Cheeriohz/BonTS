//Enums
import { CreepRole } from "../enums/enum.roles";
import { RoomEra } from "../enums/enum.roomEra";

//Configurable
import { spawnErasConfig } from "../configurable/configurable.spawnEras";

//Helpers
import { managerHelperSpawner } from "./helpers/manager.helper.spawner";
import { simpleEraSpawnHelper } from "./helpers/manager.helper.simpleEraSpawns";
import { civilizedEraSpawnHelper } from "./helpers/manager.helper.civilizedEraSpawns";

export class spawner {
    private static spawnConfig: spawnErasConfig = new spawnErasConfig();

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
        simpleEraSpawnHelper.simpleEraSpawn(room,
            basicBody,
            this.spawnConfig.stoneEraConfig.harvesters,
            this.spawnConfig.stoneEraConfig.upgraders,
            this.spawnConfig.stoneEraConfig.builders);
    }

    private static copperSpawning(room: Room) {
        simpleEraSpawnHelper.simpleEraSpawn(room,
            basicBodyPlus,
            this.spawnConfig.copperEraConfig.harvesters,
            this.spawnConfig.copperEraConfig.upgraders,
            this.spawnConfig.copperEraConfig.builders);
    }

    private static bronzeSpawning(room: Room) {
        if (managerHelperSpawner.canSpawn(room)) {
            if (civilizedEraSpawnHelper.spawnDroppers(room, dropMinerBody)) {
                if (simpleEraSpawnHelper.spawnGeneric(room, haulerBody, this.spawnConfig.bronzeEraConfig.haulers, CreepRole.hauler)) {
                    simpleEraSpawnHelper.spawnGeneric(room, droneBody, this.spawnConfig.bronzeEraConfig.drones, CreepRole.drone)
                }
            }
        }
    }
}

// Body Definitions
const basicBody = [WORK, CARRY, MOVE]; // 200 Energy
const basicBodyPlus = [WORK, WORK, CARRY, CARRY, MOVE, MOVE] // 400 Energy, for testing
const dropMinerBody = [WORK, WORK, WORK, WORK, WORK, WORK, MOVE]; // 650 Energy
const haulerBody = [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE] //600 Energy
const droneBody = [CARRY, CARRY, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE] // 800 Energy




