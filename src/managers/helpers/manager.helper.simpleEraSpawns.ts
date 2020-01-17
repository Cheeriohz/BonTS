//Helpers
import { managerHelperSpawner } from "./manager.helper.spawner"

//Enums
import { CreepRole } from "../../enums/enum.roles"

export class simpleEraSpawnHelper {



    public static simpleEraSpawn(room: Room, body: any[], harvesters: number, upgraders: number, builders: number) {
        if (managerHelperSpawner.canSpawn(room)) {
            if (this.spawnHarvesters(room, body, harvesters)) {
                if (this.spawnUpgraders(room, body, upgraders)) {
                    this.spawnBuilders(room, body, builders);
                }
            }
        }
    }

    //Region spawn specific
    public static spawnHarvesters(room: Room, body: any[], sourceModifierCap: number): boolean {
        const harvesters = managerHelperSpawner.getCreepsByType(room, CreepRole.harvester);

        if (harvesters.length < room.find(FIND_SOURCES).length * sourceModifierCap) {
            const spawns = room.find(FIND_MY_SPAWNS);

            if (spawns.length > 0) {
                managerHelperSpawner.spawnACreep(spawns[0], body, 'Harvester', CreepRole.harvester);
                return false;
            }
        }
        return true;
    }

    public static spawnUpgraders(room: Room, body: any[], cap: number): boolean {
        return this.spawnGeneric(room, body, cap, CreepRole.upgrader)
    }

    public static spawnGeneric(room: Room, body: any[], cap: number, role: CreepRole): boolean {
        const upgraders = managerHelperSpawner.getCreepsByType(room, role);

        if (upgraders.length < cap) { //TODO Figure out something better here
            const spawns = room.find(FIND_MY_SPAWNS);

            if (spawns.length > 0) {
                managerHelperSpawner.spawnACreep(spawns[0], body, CreepRole[role], role);
                return false;
            }
        }
        return true;
    }

    public static spawnBuilders(room: Room, body: any[], cap: number): boolean {
        const builders = managerHelperSpawner.getCreepsByType(room, CreepRole.builder);

        if (builders.length < cap) {
            const spawns = room.find(FIND_MY_SPAWNS);

            if (spawns.length > 0) {
                managerHelperSpawner.spawnACreep(spawns[0], body, 'Builder', CreepRole.builder);
                return false;
            }
        }
        return true;
    }
}
