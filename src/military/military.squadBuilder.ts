import { SquadTypes } from "enums/enum.squads";
import { CreepRole } from "enums/enum.roles";
import { stringify } from "querystring";

export class SquadBuilder {
    public static buildSquad(spawn: StructureSpawn, type: SquadTypes, squadName: string) {
        switch (type) {
            case SquadTypes.SKFarm: {
                this.requestSKFarmSquad(spawn, squadName);
                break;
            }
        }
    }

    private static requestSKFarmSquad(spawn: StructureSpawn, squadName: string) {
        if (!spawn.room.memory.creepRequest) {
            spawn.room.memory.creepRequest = [];
        }
        spawn.room.memory.creepRequest.push({
            body: [
                TOUGH,
                TOUGH,
                TOUGH,
                TOUGH,
                MOVE,
                MOVE,
                MOVE,
                MOVE,
                MOVE,
                MOVE,
                MOVE,
                MOVE,
                MOVE,
                MOVE,
                MOVE,
                MOVE,
                MOVE,
                MOVE,
                MOVE,
                MOVE,
                MOVE,
                MOVE,
                MOVE,
                ATTACK,
                ATTACK,
                ATTACK,
                ATTACK,
                ATTACK,
                ATTACK,
                ATTACK,
                ATTACK,
                ATTACK,
                ATTACK,
                ATTACK,
                ATTACK,
                ATTACK,
                ATTACK,
                ATTACK
            ],
            memory: {
                working: false,
                squad: squadName,
                role: CreepRole.knight
            },
            role: CreepRole.knight
        });
        spawn.room.memory.creepRequest.push({
            body: [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, HEAL, HEAL, HEAL, HEAL, HEAL, HEAL],
            memory: {
                working: false,
                squad: squadName,
                role: CreepRole.medic
            },
            role: CreepRole.medic
        });
    }
}
