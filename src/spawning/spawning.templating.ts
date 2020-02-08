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
                room.memory.roleTargets = [2 * sourceCount, 1, 0, 0, 0, 0, 0, 0, 0, 0];
                room.memory.lowRCLBoost = true;
                for (let i = 0; i < _.values(CreepRole).length / 2; i++) {
                    _.set(room.memory.templates, i, this.getDefaultForRole(i));
                }
            }
        }
    }

    public static migrateToDropHauling(room: Room) {
        const sourceCount = room.memory.sourceMap.length;
        room.memory.templates![CreepRole.upgrader] = [WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE];
        room.memory.templates![CreepRole.harvester] = [WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE];
        room.memory.roleTargets![CreepRole.dropper] = sourceCount;
        room.memory.roleTargets![CreepRole.hauler] = 2 * sourceCount;
        room.memory.roleTargets![CreepRole.upgrader] = 2 * sourceCount;
        room.memory.roleTargets![CreepRole.harvester] = 0;
        room.memory.staticUpgraders = true;
    }

    private static getDefaultForRole(role: Number): BodyPartConstant[] {
        switch (role) {
            case 0: {
                return [WORK, CARRY, MOVE];
            }
            case 1: {
                return [WORK, WORK, CARRY, MOVE];
            }
            case 2: {
                return [WORK, WORK, CARRY, MOVE];
            }
            case 3: {
                return [WORK, WORK, WORK, WORK, WORK, MOVE];
            }
            case 4: {
                return [CARRY, MOVE];
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
            default: {
                return [WORK, CARRY, MOVE];
            }
        }
    }
}
