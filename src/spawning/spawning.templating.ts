import { CreepRole } from "enums/enum.roles";
import _ from "lodash";

export class SpawnTemplate {
    public update(roomSpawnTemplates: RoomSpawnTemplates, role: CreepRole, body: BodyPartConstant[]) {
        roomSpawnTemplates[role] = body;
    }

    public static configureRoomSpawnTemplates(room: Room) {
        switch (room.controller?.level) {
            case 1: {
                room.memory.templates = {};
                const sourceCount = room.find(FIND_SOURCES).length;
                room.memory.roleTargets = [1 * sourceCount, 1 * sourceCount, 2 * sourceCount, 0, 2, 0, 0, 0, 0, 0];
                room.memory.lowRCLBoost = true;
                for (let i = 0; i < _.values(CreepRole).length / 2; i++) {
                    _.set(room.memory.templates, i, this.getDefaultForRole(i));
                }
            }
        }
    }

    //* RCL2 -> 550 Energy
    public static RCL2Improvements(room: Room) {
        const sourceCount = room.memory.sourceMap.length;
        room.memory.templates![CreepRole.upgrader] = [WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE];
        room.memory.templates![CreepRole.harvester] = [WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE];
        room.memory.templates![CreepRole.builder] = [WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE];
        room.memory.templates![CreepRole.dropper] = [WORK, WORK, WORK, WORK, WORK, MOVE];
        room.memory.templates![CreepRole.hauler] = [CARRY, CARRY, MOVE, MOVE];
        room.memory.roleTargets![CreepRole.dropper] = sourceCount;
        room.memory.roleTargets![CreepRole.hauler] = 2 * sourceCount;
        room.memory.roleTargets![CreepRole.upgrader] = 2 * sourceCount;
        room.memory.roleTargets![CreepRole.harvester] = 0;
        room.memory.staticUpgraders = true;
    }

    //* RCL3 -> 800 Energy
    public static RCL3Improvements(room: Room) {
        const sourceCount = room.memory.sourceMap.length;
        // Improve Harvesters, should all be remote by now.
        room.memory.templates![CreepRole.builder] = [
            WORK,
            WORK,
            WORK,
            WORK,
            CARRY,
            CARRY,
            CARRY,
            CARRY,
            MOVE,
            MOVE,
            MOVE,
            MOVE
        ];

        // Enable upgrader Taxi
        room.memory.upgraderTaxi = true;
        room.memory.templates![CreepRole.upgrader] = [WORK, WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY];
        room.memory.roleTargets![CreepRole.upgrader] = sourceCount;

        // Beef up builder
        room.memory.templates![CreepRole.builder] = [
            WORK,
            WORK,
            WORK,
            WORK,
            WORK,
            CARRY,
            CARRY,
            CARRY,
            MOVE,
            MOVE,
            MOVE
        ];

        // Remove dropper legs
        room.memory.templates![CreepRole.dropper] = [WORK, WORK, WORK, WORK, WORK];
    }

    //* RCL4 -> 1300 Energy
    public static RCL4Improvements(room: Room) {
        // Improve Harvesters, Remote Mines will be implemented soon at which point they will be obsolete.
        room.memory.templates![CreepRole.builder] = [
            WORK,
            WORK,
            WORK,
            WORK,
            WORK,
            CARRY,
            CARRY,
            CARRY,
            CARRY,
            CARRY,
            MOVE,
            MOVE,
            MOVE,
            MOVE,
            MOVE
        ];

        // Roads will be finished, change Haulers for efficiency.
        room.memory.templates![CreepRole.hauler] = [CARRY, CARRY, MOVE];

        // TODO Probably should make builders taxi-able at this point.
    }

    // TODO finish these
    //* RCL5 -> 1800 Energy
    public static RCL5Improvements(room: Room) {}

    //* RCL6 -> 2300 Energy
    public static RCL6Improvements(room: Room) {}

    //* RCL7 -> 5300 Energy
    public static RCL7Improvements(room: Room) {}

    //* RCL8 -> 12300 Energy
    public static RCL8Improvements(room: Room) {}

    private static getDefaultForRole(role: Number): BodyPartConstant[] {
        switch (role) {
            case 0: {
                return [WORK, CARRY, MOVE];
            }
            case 1: {
                return [WORK, WORK, WORK];
            }
            case 2: {
                return [CARRY, MOVE];
            }
            case 3: {
                return [WORK, CARRY, CARRY, MOVE, MOVE];
            }
            case 4: {
                return [WORK, WORK, CARRY, MOVE];
            }
            case 5: {
                return [WORK, CARRY, MOVE];
            }
            case 6: {
                return [MOVE];
            }
            case 7: {
                return [CLAIM, CLAIM, MOVE];
            }
            case 8: {
                return [TOUGH, ATTACK, MOVE, MOVE];
            }
            case 9: {
                return [CARRY, CARRY, MOVE];
            }
            case 10: {
                return [MOVE, RANGED_ATTACK];
            }
            case 11: {
                return [MOVE, MOVE];
            }
            default: {
                return [WORK, CARRY, MOVE];
            }
        }
    }
}
