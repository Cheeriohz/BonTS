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

        const spawns = Game.spawns;
        for (const spawn in spawns) {
            // check to see if we can spawn.
            if (Game.spawns[spawn].room.memory.era === RoomEra.stone) {
                this.stoneSpawning(Game.spawns[spawn].room);
            }
            else if (Game.spawns[spawn].room.memory.era === RoomEra.copper) {
                this.copperSpawning(Game.spawns[spawn].room);
            }
            else if (Game.spawns[spawn].room.memory.era === RoomEra.bronze) {
                this.bronzeSpawning(Game.spawns[spawn]);
            }
        }
    }

    public static populateCreepCounts() {
        const roomCreepMap: Dictionary<number[]> = {};
        const roleArray: number[] = this.createCreepRoleArray();
        for (const creep of _.values(Game.creeps)) {
            if (!creep.memory.dedication) {
                if (roomCreepMap[creep.room.name]) {
                    _.update(roomCreepMap, `${creep.room.name}[${creep.memory.role}]`, (n) => n + 1);
                }
                else {
                    // If we see multi room miscounts, check here
                    _.assign(roomCreepMap, this.createCreepRoleMap(creep, roleArray));
                }
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

    private static bronzeSpawning(spawn: StructureSpawn) {
        const room: Room = spawn.room;
        if (!spawn.spawning) {
            if (CivilizedEraSpawnHelper.spawnDroppers(room, dropMinerBody)) {
                if (SimpleEraSpawnHelper.spawnGeneric(room, haulerBody, this.spawnConfig.bronzeEraConfig.haulers, CreepRole.hauler)) {
                    if (SimpleEraSpawnHelper.spawnGeneric(room, droneBody, this.spawnConfig.bronzeEraConfig.drones, CreepRole.drone)) {
                        this.checkForSpawnRequest(spawn)
                    }
                }
            }
        }
    }

    private static checkForSpawnRequest(spawn: StructureSpawn) {
        if (spawn.memory.creepRequest) {
            if (spawn.memory.creepRequest.length > 0) {
                const request: CreepRequest = spawn.memory.creepRequest[0];
                if (request.memory) {
                    if (ManagerHelperSpawner.spawnACreepWithMemory(spawn, request.body, CreepRole[request.role], request.role, request.memory) == OK) {
                        spawn.memory.creepRequest = _.takeRight(spawn.memory.creepRequest, spawn.memory.creepRequest.length - 1);
                    }
                }
                else {
                    if (ManagerHelperSpawner.spawnACreep(spawn, request.body, CreepRole[request.role], request.role) == OK) {
                        spawn.memory.creepRequest = _.takeRight(spawn.memory.creepRequest, spawn.memory.creepRequest.length - 1);
                    }
                }
                return;
            }
        }
        if (spawn.memory.dedicatedCreepRequest) {
            if (spawn.memory.dedicatedCreepRequest.length > 0) {
                const request: DedicatedCreepRequest = spawn.memory.dedicatedCreepRequest[0];
                if (ManagerHelperSpawner.spawnADedicatedCreep(spawn, request.body, request.specifiedName, request.role, request.dedication, request.home) == OK) {
                    spawn.memory.dedicatedCreepRequest = _.takeRight(spawn.memory.dedicatedCreepRequest, spawn.memory.dedicatedCreepRequest.length - 1);
                }
                return;
            }
        }
    }



}

// Body Definitions
const basicBody = [WORK, CARRY, MOVE]; // 200 Energy
const basicBodyPlus = [WORK, WORK, CARRY, CARRY, MOVE, MOVE] // 400 Energy, for testing
const dropMinerBody = [WORK, WORK, WORK, WORK, WORK, WORK, MOVE]; // 650 Energy
//const haulerBody = [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE] // 600 Energy
const haulerBody = [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE] // 600 Energy
const droneBody = [CARRY, CARRY, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE] // 800 Energy
const repairBody = [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY]



