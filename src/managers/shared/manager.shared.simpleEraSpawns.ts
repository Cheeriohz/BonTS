// Helpers
import { ManagerHelperSpawner } from "./manager.shared.spawner"

// Enums
import { CreepRole } from "../../enums/enum.roles"
import _ from "lodash";

export class SimpleEraSpawnHelper {



    public static simpleEraSpawn(room: Room, body: any[], harvesters: number, upgraders: number, builders: number) {
        if (ManagerHelperSpawner.canSpawn(room)) {
            if (this.spawnHarvesters(room, body, harvesters)) {
                if (this.spawnUpgraders(room, body, upgraders)) {
                    this.spawnBuilders(room, body, builders);
                }
            }
        }
    }

    // Region spawn specific
    public static spawnHarvesters(room: Room, body: any[], sourceModifierCap: number): boolean {

        if (Memory.roleRoomMap[room.name][CreepRole.harvester] < room.find(FIND_SOURCES).length * sourceModifierCap) {
            const spawns = room.find(FIND_MY_SPAWNS);

            if (spawns.length > 0) {
                ManagerHelperSpawner.spawnACreep(spawns[0], body, 'Harvester', CreepRole.harvester);
                return false;
            }
        }
        return true;
    }

    public static spawnUpgraders(room: Room, body: any[], cap: number): boolean {
        return this.spawnGeneric(room, body, cap, CreepRole.upgrader)
    }

    public static spawnGeneric(room: Room, body: any[], cap: number, role: CreepRole): boolean {

        const roomRoleTracker = _.get(Memory.roleRoomMap, `[${room.name}][${role}]`, 0);

        if (roomRoleTracker < cap) {
            const spawns = room.find(FIND_MY_SPAWNS);

            if (spawns.length > 0) {
                ManagerHelperSpawner.spawnACreep(spawns[0], body, CreepRole[role], role);
                return false;
            }
        }
        return true;
    }

    public static spawnBuilders(room: Room, body: any[], cap: number): boolean {

        if (Memory.roleRoomMap[room.name][CreepRole.builder] < cap) {
            const spawns = room.find(FIND_MY_SPAWNS);

            if (spawns.length > 0) {
                ManagerHelperSpawner.spawnACreep(spawns[0], body, 'Builder', CreepRole.builder);
                return false;
            }
        }
        return true;
    }
}
