import _ from "lodash";

export class ManagerHelperSpawner {

    public static spawnACreep(spawn: StructureSpawn, body: any[], name: string, assignedRole: number) {
        const returnCode = spawn.spawnCreep(body,
            `${name}${Game.time.toString()}`,
            { memory: { role: assignedRole, working: false, orders: null, ignoreLinks: null, dedication: null, precious: null } });
        if (returnCode === 0) {
            this.updateRoomRoleMap(spawn, assignedRole);
        }
        return returnCode;
    }

    public static spawnACreepWithMemory(spawn: StructureSpawn, body: any[], name: string, assignedRole: number, memory: CreepMemory) {
        const returnCode = spawn.spawnCreep(body,
            `${name}${Game.time.toString()}`,
            { memory: memory });
        if (returnCode === 0) {
            this.updateRoomRoleMap(spawn, assignedRole);
        }
        return returnCode;
    }

    public static spawnADedicatedCreep(spawn: StructureSpawn,
        body: any[],
        name: string,
        assignedRole: number,
        dedication: string,
        home?: string | null) {
        const returnCode = spawn.spawnCreep(body, name,
            { memory: { role: assignedRole, working: false, orders: null, ignoreLinks: null, dedication: dedication, precious: null, home: home } });
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

