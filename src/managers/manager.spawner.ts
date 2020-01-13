export class spawner {


    public static run() {
        let myRooms = Game.rooms;
        for (let room in myRooms) {
            //check to see if we can spawn.
            if (myRooms[room].memory.era == 0) {
                this.stoneSpawning(myRooms[room]);
            }
            else if (myRooms[room].memory.era == 1) {
                this.copperSpawning(myRooms[room]);
            }
        }

    }

    //Region eras
    private static copperSpawning(room: Room) {
        if (this.canSpawn(room)) {
            this.spawnHarvesters(room);
            this.spawnUpgraders(room);
            this.spawnBuilders(room, basicBody);
        }
    }

    private static stoneSpawning(room: Room) {
        if (this.canSpawn(room)) {
            this.spawnBuilders(room, basicBodyPlus);
            this.spawnUpgraders(room);
            this.spawnHarvesters(room);
        }
    }



    //Region spawn specific
    private static spawnHarvesters(room: Room) {
        let harvesters = this.getCreepsByType(room, 0);

        if (harvesters.length < room.find(FIND_SOURCES).length) {
            let spawns = room.find(FIND_MY_SPAWNS);

            if (spawns.length > 0) {
                spawns[0].spawnCreep(basicBody,
                    `Harvester${Game.time.toString()}`,
                    { memory: { role: 0, working: false } })
            }
        }
    }

    private static spawnUpgraders(room: Room) {
        let upgraders = this.getCreepsByType(room, 1);

        if (upgraders.length < (room.find(FIND_SOURCES).length * 3) - 1) {
            let spawns = room.find(FIND_MY_SPAWNS);

            if (spawns.length > 0) {
                spawns[0].spawnCreep(basicBody,
                    `Upgrader${Game.time.toString()}`,
                    { memory: { role: 1, working: false } })
            }
        }
    }

    private static spawnBuilders(room: Room, body: any[]) {
        let builders = this.getCreepsByType(room, 2);

        if (builders.length < 5) {
            let spawns = room.find(FIND_MY_SPAWNS);

            if (spawns.length > 0) {
                this.spawnACreep(spawns[0], body, 'Builder', 2);
            }
        }
    }

    //Region internal shared
    private static spawnACreep(spawn: StructureSpawn, body: any[], name: string, assignedRole: number) {
        spawn.spawnCreep(body,
            `${name}${Game.time.toString()}`,
            { memory: { role: assignedRole, working: false } });
    }

    private static getCreepsByType(room: Room, roleNumber: number) {
        return _.filter(Game.creeps, (creep) => creep.memory.role == roleNumber
            && creep.room.name == room.name);
    }

    private static canSpawn(room: Room) {
        let spawns = room.find(FIND_MY_SPAWNS);
        for (let spawn in spawns) {
            if (!spawns[spawn].spawning) {
                return true;
            }
        }
        return false;
    }
}

// Body Definitions
const basicBody = [WORK, CARRY, MOVE]; // 200 Energy
const basicBodyPlus = [WORK, WORK, CARRY, CARRY, MOVE, MOVE] // 400 Energy, for testing
const dropMinerBody = [WORK, WORK, WORK, WORK, WORK, MOVE]; // 550 Energy
const haulerBody = [CARRY, CARRY, CARRY, WORK, WORK, MOVE, MOVE, MOVE, MOVE] //550 Energy



