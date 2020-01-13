
export class managerHelperSpawner {

    public static spawnACreep(spawn: StructureSpawn, body: any[], name: string, assignedRole: number) {
        spawn.spawnCreep(body,
            `${name}${Game.time.toString()}`,
            { memory: { role: assignedRole, working: false } });
    }

    public static getCreepsByType(room: Room, roleNumber: number) {
        return _.filter(Game.creeps, (creep) => creep.memory.role == roleNumber
            && creep.room.name == room.name);
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

