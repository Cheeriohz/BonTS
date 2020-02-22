import { CreepRole } from "enums/enum.roles";
import _ from "lodash";

export class SpawnWrapper {
    public static spawnGeneric(room: Room, body: any[], cap: number, role: CreepRole): boolean {
        const roomRoleTracker = _.get(Memory.roleRoomMap, `[${room.name}][${role}]`, 0);

        if (roomRoleTracker < cap) {
            const spawns = room.find(FIND_MY_SPAWNS);

            if (spawns.length > 0) {
                this.spawnACreep(spawns[0], body, CreepRole[role], role);
                return false;
            }
        }
        return true;
    }

    public static spawnACreep(spawn: StructureSpawn, body: any[], name: string, assignedRole: number) {
        const returnCode = spawn.spawnCreep(body, `${name}${Memory.creepTicker}`, {
            memory: {
                role: assignedRole,
                working: false,
                orders: null,
                ignoreLinks: null,
                dedication: null,
                precious: null
            }
        });
        Memory.creepTicker++;
        if (returnCode === 0) {
            this.updateRoomRoleMap(spawn, assignedRole);
        }
        return returnCode;
    }

    public static spawnACreepWithMemory(
        spawn: StructureSpawn,
        body: any[],
        name: string,
        assignedRole: number,
        memory: CreepMemory
    ) {
        const returnCode = spawn.spawnCreep(body, `${name}${Memory.creepTicker}`, { memory: memory });
        Memory.creepTicker++;
        if (returnCode === 0) {
            this.updateRoomRoleMap(spawn, assignedRole);
        }
        return returnCode;
    }

    public static spawnADedicatedCreep(
        spawn: StructureSpawn,
        body: any[],
        name: string,
        assignedRole: number,
        dedication: string,
        precious?: string | null,
        home?: string | null,
        orders?: CreepOrder | null
    ) {
        const returnCode = spawn.spawnCreep(body, name, {
            memory: {
                role: assignedRole,
                working: false,
                ignoreLinks: null,
                dedication: dedication,
                precious: precious,
                home: home,
                orders: orders
            }
        });
        if (returnCode === ERR_NAME_EXISTS) {
            return OK;
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
        return _.filter(Game.creeps, creep => creep.memory.role === roleNumber && creep.room.name === room.name);
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
