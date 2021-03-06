// Enums
import { CreepRole } from "../enums/enum.roles";

// Dependencies
import _ from "lodash";
import { SpawnTemplate } from "./spawning.templating";
import { CreepIsYouthful } from "caching/caching.creepCaching";
import { SpawnWrapper } from "./spawning.spawnWrappers";

export class Spawn {
    public static run() {
        const spawns = Game.spawns;
        for (const spawn of _.values(spawns)) {
            if (!spawn.room.memory.templates) {
                SpawnTemplate.configureRoomSpawnTemplates(spawn.room);
            }
            this.manageCreepSpawn(spawn);
        }
    }

    private static manageCreepSpawn(spawn: StructureSpawn) {
        if (spawn.spawning) {
            return;
        }
        const countMap = Memory.roleRoomMap[spawn.room.name];
        let roleMapUnderFilled: boolean = false;
        if (countMap) {
            for (let i = 0; i < spawn.room.memory.roleTargets!.length; i++) {
                if (countMap[i] < spawn.room.memory.roleTargets![i]) {
                    roleMapUnderFilled = true;
                    SpawnWrapper.spawnGeneric(spawn, spawn.room.memory.templates![i], i);
                    return;
                }
            }
            if (!roleMapUnderFilled) {
                this.checkForSpawnRequest(spawn);
            }
        } else {
            SpawnWrapper.spawnACreep(spawn, [WORK, CARRY, MOVE], CreepRole[0], 0);
        }
    }

    private static checkForSpawnRequest(spawn: StructureSpawn): boolean {
        if (spawn.room.memory.creepRequest) {
            if (spawn.room.memory.creepRequest.length > 0) {
                const request: CreepRequest = spawn.room.memory.creepRequest[0];
                if (request.memory) {
                    if (
                        SpawnWrapper.spawnACreepWithMemory(
                            spawn,
                            request.body,
                            CreepRole[request.role],
                            request.role,
                            request.memory
                        ) == OK
                    ) {
                        spawn.room.memory.creepRequest = _.takeRight(
                            spawn.room.memory.creepRequest,
                            spawn.room.memory.creepRequest.length - 1
                        );
                        return false;
                    }
                } else {
                    if (SpawnWrapper.spawnACreep(spawn, request.body, CreepRole[request.role], request.role) == OK) {
                        spawn.room.memory.creepRequest = _.takeRight(
                            spawn.room.memory.creepRequest,
                            spawn.room.memory.creepRequest.length - 1
                        );
                        return false;
                    }
                }
            }
        }
        if (spawn.room.memory.dedicatedCreepRequest) {
            if (spawn.room.memory.dedicatedCreepRequest.length > 0) {
                const request: DedicatedCreepRequest = spawn.room.memory.dedicatedCreepRequest[0];
                if (
                    SpawnWrapper.spawnADedicatedCreep(
                        spawn,
                        request.body,
                        request.specifiedName,
                        request.role,
                        request.dedication,
                        request.precious,
                        request.home,
                        request.orders
                    ) == OK
                ) {
                    spawn.room.memory.dedicatedCreepRequest = _.takeRight(
                        spawn.room.memory.dedicatedCreepRequest,
                        spawn.room.memory.dedicatedCreepRequest.length - 1
                    );
                    return false;
                }
            }
        }
        return true;
    }

    //* Spawn Natural Maintenance Threshold Management
    public static populateCreepCounts() {
        const roomCreepMap: Dictionary<number[]> = {};
        for (const creep of _.values(Game.creeps)) {
            if (!creep.memory.dedication && !creep.memory.home) {
                if (CreepIsYouthful(creep)) {
                    if (roomCreepMap[creep.room.name]) {
                        if (
                            creep.memory.role === CreepRole.taxi &&
                            creep.memory.taxi &&
                            creep.memory.taxi.originalRole
                        ) {
                            _.update(
                                roomCreepMap,
                                `${creep.room.name}[${creep.memory.taxi!.originalRole}]`,
                                n => n + 1
                            );
                        } else {
                            _.update(roomCreepMap, `${creep.room.name}[${creep.memory.role}]`, n => n + 1);
                        }
                    } else {
                        _.assign(roomCreepMap, this.createCreepRoleMap(creep, this.createCreepRoleArray()));
                    }
                }
            }
        }
        Memory.roleRoomMap = roomCreepMap;
    }

    private static createCreepRoleArray(): number[] {
        const roleCount: number = _.values(CreepRole).length;
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
}
