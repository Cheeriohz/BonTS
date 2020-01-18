//Helpers
import { managerHelperSpawner } from "./manager.helper.spawner"

//Enums
import { CreepRole } from "../../enums/enum.roles"

export class civilizedEraSpawnHelper {

    public static spawnDroppers(room: Room, body: any[]): boolean {

        const containers: number = room.find<StructureContainer>(FIND_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType == STRUCTURE_CONTAINER)
            }
        }).length;

        if (Memory.roleRoomMap[room.name][CreepRole.dropper] < containers) {
            const spawns = room.find(FIND_MY_SPAWNS);

            if (spawns.length > 0) {
                managerHelperSpawner.spawnACreep(spawns[0], body, "dropper", CreepRole.dropper);
                return false;
            }
        }
        return true;
    }

}
