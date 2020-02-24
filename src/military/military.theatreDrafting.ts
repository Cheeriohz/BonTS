import { TheatreTypes } from "enums/enum.theatre";
import { SquadTypes } from "enums/enum.squads";
import { SquadBuilder } from "./military.squadBuilder";
import _ from "lodash";

export class TheatreDrafting {
    public static draftSquad(spawn: StructureSpawn, theatreName: string) {
        const theatre = Memory.theatres[theatreName];
        if (theatre) {
            if (!theatre.squadActive) {
                const squadName = `💣${Memory.creepTicker}`;
                const squad: Squad = {
                    squadName: squadName,
                    type: SquadTypes.SKFarm,
                    wellStaffed: false,
                    theatre: theatreName,
                    pos: [theatre.rallyLocation.x, theatre.rallyLocation.y],
                    enlistees: [],
                    activeCombatZone: false
                };
                _.set(Memory.squads, squadName, squad);
                SquadBuilder.buildSquad(spawn, TheatreDrafting.getSquadTypeForTheatreType(theatre.type), squadName);
                theatre.squadActive = true;
            }
        }
    }

    public static getSquadTypeForTheatreType(type: TheatreTypes): SquadTypes {
        switch (type) {
            case TheatreTypes.SKFarm: {
                return SquadTypes.SKFarm;
            }
        }
    }
}
