//Enums
import { CreepRole } from "../enums/enum.roles";
import { RoomEra } from "../enums/enum.roomEra";

//Configurable
import { spawnErasConfig } from "../configurable/configurable.spawnEras";

//Helpers
import { managerHelperSpawner } from "./helpers/manager.helper.spawner";
import { simpleEraSpawnHelper } from "./helpers/manager.helper.simpleEraSpawns";
import { civilizedEraSpawnHelper } from "./helpers/manager.helper.civilizedEraSpawns";
import _ from "lodash";

export class spawner {
    private static spawnConfig: spawnErasConfig = new spawnErasConfig();

    public static run() {

        if (Memory.cycle % 5 === 0) {
            this.populateCreepCounts();
        }

        const myRooms = Game.rooms;
        for (const room in myRooms) {
            //check to see if we can spawn.
            if (myRooms[room].memory.era == RoomEra.stone) {
                this.stoneSpawning(myRooms[room]);
            }
            else if (myRooms[room].memory.era == RoomEra.copper) {
                this.copperSpawning(myRooms[room]);
            }
            else if (myRooms[room].memory.era == RoomEra.bronze) {
                this.bronzeSpawning(myRooms[room]);
            }
        }
    }

    private static populateCreepCounts() {
        let roomCreepMap: Dictionary<number[]> = {};
        const roleArray: number[] = this.createCreepRoleArray();
        for (const creepName in Game.creeps) {
            let creep: Creep = Game.creeps[creepName];
            if (roomCreepMap[creep.room.name]) {
                _.update(roomCreepMap, `${creep.room.name}[${creep.memory.role}]`, function (n) { return n + 1; });
            }
            else {
                //If we see multi room miscounts, check here
                _.assign(roomCreepMap, this.createCreepRoleMap(creep, roleArray));
            }

        }
        Memory.roleRoomMap = roomCreepMap;
    }


    private static createCreepRoleArray(): number[] {
        const roleCount: number = _.values(CreepRole).length
        let roleArray: number[] = [];
        for (let i = 0; i < roleCount / 2; i++) {
            roleArray.push(0);
        }
        return roleArray;
    }

    private static createCreepRoleMap(creep: Creep, roleArray: number[]): object {
        roleArray[creep.memory.role]++;
        return _.set({}, creep.room.name, roleArray);
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




