import _ from "lodash";

export class ManagerHelperSpawner {

    public static spawnACreep(spawn: StructureSpawn, body: any[], name: string, assignedRole: number) {
        const returnCode = spawn.spawnCreep(body,
            `${name}${Game.time.toString()}`,
            { memory: { role: assignedRole, working: false, orders: null, ignoreLinks: null } });
        if (returnCode === 0) {
            this.updateRoomRoleMap(spawn, assignedRole);
        }
        return returnCode;
    }


    public static updateRoomRoleMap(spawn: StructureSpawn, roleToUpdate: number) {
        let roleRoomMap = Memory.roleRoomMap[spawn.room.name];
        if (roleRoomMap) {
            roleRoomMap[roleToUpdate] += 1;
        }
    }

    public static getCreepsByType(room: Room, roleNumber: number) {
        return _.filter(Game.creeps, (creep) => creep.memory.role === roleNumber
            && creep.room.name === room.name);
    }

    public static canSpawn(room: Room) {
        const spawns = room.find(FIND_MY_SPAWNS);
        for (const spawn in spawns) {
            if (!spawns[spawn].spawning) {
                return true;
            }
        }
        return false;
    }
}

