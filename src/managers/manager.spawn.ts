// Enums
import { CreepRole } from "../enums/enum.roles";
import { RoomEra } from "../enums/enum.roomEra";

// Configurable
import { SpawnErasConfig } from "../configurable/configurable.spawnEras";

// Shared
import { CivilizedEraSpawnHelper } from "./shared/manager.shared.civilizedEraSpawns";
import { SimpleEraSpawnHelper } from "./shared/manager.shared.simpleEraSpawns";
import { ManagerHelperSpawner } from "./shared/manager.shared.spawner";

// Dependencies
import _ from "lodash";

export class Spawn {
    private static spawnConfig: SpawnErasConfig = new SpawnErasConfig();

    public static run() {

        const myRooms = Game.rooms;
        for (const room in myRooms) {
            // check to see if we can spawn.
            if (myRooms[room].memory.era === RoomEra.stone) {
                this.stoneSpawning(myRooms[room]);
            }
            else if (myRooms[room].memory.era === RoomEra.copper) {
                this.copperSpawning(myRooms[room]);
            }
            else if (myRooms[room].memory.era === RoomEra.bronze) {
                this.bronzeSpawning(myRooms[room]);
            }
        }
    }

    public static populateCreepCounts() {
        const roomCreepMap: Dictionary<number[]> = {};
        const roleArray: number[] = this.createCreepRoleArray();
        for (const creepName in Game.creeps) {
            const creep: Creep = Game.creeps[creepName];
            if (roomCreepMap[creep.room.name]) {
                _.update(roomCreepMap, `${creep.room.name}[${creep.memory.role}]`, (n) => n + 1);
            }
            else {
                // If we see multi room miscounts, check here
                _.assign(roomCreepMap, this.createCreepRoleMap(creep, roleArray));
            }

        }
        Memory.roleRoomMap = roomCreepMap;
    }


    private static createCreepRoleArray(): number[] {
        const roleCount: number = _.values(CreepRole).length
        const roleArray: number[] = [];
        for (let i = 0; i < roleCount / 2; i++) {
            roleArray.push(0);
        }
        return roleArray;
    }

    private static createCreepRoleMap(creep: Creep, roleArray: number[]): object {
        roleArray[creep.memory.role]++;
        return _.set({}, creep.room.name, roleArray);
    }

    // Region eras
    private static stoneSpawning(room: Room) {
        SimpleEraSpawnHelper.simpleEraSpawn(room,
            basicBody,
            this.spawnConfig.stoneEraConfig.harvesters,
            this.spawnConfig.stoneEraConfig.upgraders,
            this.spawnConfig.stoneEraConfig.builders);
    }

    private static copperSpawning(room: Room) {
        SimpleEraSpawnHelper.simpleEraSpawn(room,
            basicBodyPlus,
            this.spawnConfig.copperEraConfig.harvesters,
            this.spawnConfig.copperEraConfig.upgraders,
            this.spawnConfig.copperEraConfig.builders);
    }

    private static bronzeSpawning(room: Room) {
        if (ManagerHelperSpawner.canSpawn(room)) {
            if (CivilizedEraSpawnHelper.spawnDroppers(room, dropMinerBody)) {
                if (SimpleEraSpawnHelper.spawnGeneric(room, haulerBody, this.spawnConfig.bronzeEraConfig.haulers, CreepRole.hauler)) {
                    if (SimpleEraSpawnHelper.spawnGeneric(room, droneBody, this.spawnConfig.bronzeEraConfig.drones, CreepRole.drone)) {
                        SimpleEraSpawnHelper.spawnBuilders(room, repairBody, this.spawnConfig.bronzeEraConfig.builders);
                    }
                }
            }
        }
    }
}

// Body Definitions
const basicBody = [WORK, CARRY, MOVE]; // 200 Energy
const basicBodyPlus = [WORK, WORK, CARRY, CARRY, MOVE, MOVE] // 400 Energy, for testing
const dropMinerBody = [WORK, WORK, WORK, WORK, WORK, WORK, MOVE]; // 650 Energy
const haulerBody = [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE] // 600 Energy
const droneBody = [CARRY, CARRY, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE] // 800 Energy
const repairBody = [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY]



