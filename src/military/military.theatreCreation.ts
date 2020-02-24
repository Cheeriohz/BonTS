import { Spawn } from "spawning/manager.spawn";
import { TheatreTypes } from "enums/enum.theatre";
import { GeneralBuilding } from "building/base/building.general";
import _ from "lodash";
import { SquadTypes } from "enums/enum.squads";
import { SquadBuilder } from "./military.squadBuilder";

export class TheatreCreation extends GeneralBuilding {
    public static createSKFarmTheatre(spawn: StructureSpawn, roomName: string) {
        // identify a local rally location;
        // TODO MAKE BETTER
        const rally = spawn.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: s => s.structureType === STRUCTURE_RAMPART
        });
        if (rally) {
            TheatreCreation.CreateSKFarmForRally(spawn, rally, roomName);
        }
    }

    private static CreateSKFarmForRally(spawn: StructureSpawn, rally: AnyStructure, roomName: string) {
        const pfp: PathFinderPath = PathFinder.search(rally.pos, {
            pos: new RoomPosition(25, 25, roomName),
            range: 23
        });
        if (!pfp.incomplete) {
            let translatedPath: RoomPathCostingRetainer[] = new Array<RoomPathCostingRetainer>();
            pfp.path = _.concat([rally.pos], pfp.path);
            GeneralBuilding.translateOneWay(pfp.path, translatedPath);
            let deploymentPath: PathStep[] = [];
            for (const roomPath of _.values(translatedPath)) {
                deploymentPath = _.concat(deploymentPath, roomPath.path);
            }
            const theatreName = `⚔️${Memory.creepTicker}`;
            const theatre: Theatre = {
                type: TheatreTypes.SKFarm,
                rallyLocation: rally.pos,
                deploymentPath: deploymentPath,
                roomName: roomName,
                squadActive: true,
                currentSegment: 0,
                tick: 0
            };
            if (!Memory.theatres) {
                Memory.theatres = {};
            }
            _.set(Memory.theatres, theatreName, theatre);
            const squadName = `💣${Memory.creepTicker}`;
            const squad: Squad = {
                squadName: squadName,
                type: SquadTypes.SKFarm,
                wellStaffed: false,
                theatre: theatreName,
                pos: [rally.pos.x, rally.pos.y],
                enlistees: [],
                activeCombatZone: false
            };
            if (!Memory.squads) {
                Memory.squads = {};
            }
            _.set(Memory.squads, squadName, squad);
            SquadBuilder.buildSquad(spawn, SquadTypes.SKFarm, squadName);
            if (!spawn.room.memory.theatres) {
                spawn.room.memory.theatres = [];
            }
            spawn.room.memory.theatres.push(theatreName);
        }
    }
}
