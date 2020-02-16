import { BuildProjectEnum } from "./interfaces/building.enum";
import _ from "lodash";
import { SpawnTemplate } from "spawning/spawning.templating";
import { buildEmptyContainerMap } from "caching/manager.containerSelector";
import { CreepRole } from "enums/enum.roles";
import { ReservationManager } from "remote/manager.remote.reservation";

export class BuildProjectHandoff {
    public static handOffProject(remote: boolean, project: BuildProject, spawn: StructureSpawn) {
        switch (project.projectType) {
            case BuildProjectEnum.LocalMineralExpansion: {
                BuildProjectHandoff.handOffLocalMineralExpansion(project, spawn);
                break;
            }
            case BuildProjectEnum.LocalContainerExpansion: {
                BuildProjectHandoff.handOffLocalContainerExpansion(project, spawn);
                break;
            }
            case BuildProjectEnum.RemoteContainerExpansion: {
                // TODO Need to ensure if we are running multi project execution that we don't hand off the end point project
                BuildProjectHandoff.attemptRemoteContainerExpansionHandOff(remote, project, spawn);
                break;
            }
            case BuildProjectEnum.SingleConstructionSiteNoFollowUp:
            case BuildProjectEnum.PassThroughCreate: {
                _.remove(spawn.room.memory.buildProjects!, p => p === project);
                break;
            }
            case BuildProjectEnum.ExtensionBootstrap: {
                BuildProjectHandoff.ExtensionProjectRCLSwitch(project, spawn);
                _.remove(spawn.room.memory.buildProjects!, p => p === project);
                break;
            }
            case BuildProjectEnum.SpawnRemoteAddition: {
                BuildProjectHandoff.handOffSpawnRemoteAddition(project, spawn);
                const room = Game.rooms[project.roomName];
                if (room) {
                    // This isn't critical to do here, but it doesn't hurt.
                    SpawnTemplate.configureRoomSpawnTemplates(room);
                }
                _.remove(spawn.room.memory.buildProjects!, p => p === project);
                break;
            }
        }
    }

    private static ExtensionProjectRCLSwitch(project: BuildProject, spawn: StructureSpawn) {
        switch (spawn.room.controller!.level) {
            case 2: {
                SpawnTemplate.RCL2Improvements(spawn.room);
            }
            case 3: {
                SpawnTemplate.RCL3Improvements(spawn.room);
            }
            case 4: {
                SpawnTemplate.RCL4Improvements(spawn.room);
            }
            case 5: {
                SpawnTemplate.RCL5Improvements(spawn.room);
            }
            case 6: {
                SpawnTemplate.RCL6Improvements(spawn.room);
            }
            case 7: {
                SpawnTemplate.RCL7Improvements(spawn.room);
            }
            case 8: {
                SpawnTemplate.RCL8Improvements(spawn.room);
            }
        }
    }

    private static attemptRemoteContainerExpansionHandOff(
        remote: boolean,
        project: BuildProject,
        spawn: StructureSpawn
    ) {
        if (spawn.room.memory.buildProjects!.length > 1) {
            // There are more build Projects for this remote expansion, remove the current project and allow it to continue.
            _.remove(spawn.room.memory.buildProjects!, project);
            if (remote) {
                // If we are already in the remote phase, reassign the remote builder.
                const remoteBot = BuildProjectHandoff.getActiveRemoteBuilder(project.roomName);
                if (remoteBot) {
                    remoteBot.memory.dedication = spawn.room.memory.buildProjects![0].roomName;
                }
            }
        } else {
            BuildProjectHandoff.handOffRemoteContainerExpansion(project, spawn);
        }
    }

    public static getActiveRemoteBuilder(roomName: string): Creep | null {
        for (const creep of _.values(Game.creeps)) {
            if (creep.memory.role === CreepRole.builder) {
                if (creep.memory.dedication) {
                    if (creep.memory.dedication === roomName) {
                        return creep;
                    }
                }
            }
        }
        return null;
    }

    private static handOffRemoteContainerExpansion(project: BuildProject, spawn: StructureSpawn) {
        const remoteMine: RemoteMine | undefined = _.find(spawn.room.memory.remoteMines, rm => {
            return (
                rm.containerId === null &&
                rm.haulers === null &&
                rm.extractorId === null &&
                rm.miner === null &&
                rm.roomName === project.roomName
            );
        });
        if (remoteMine) {
            const endPath = _.last(remoteMine!.pathingLookup[project.roomName][0]);
            if (endPath) {
                const containerPos = new RoomPosition(endPath.x, endPath.y, project.roomName);
                if (containerPos) {
                    const container = containerPos
                        .lookFor(LOOK_STRUCTURES)
                        .find(s => s.structureType === STRUCTURE_CONTAINER);
                    if (container) {
                        const source = container.pos.findClosestByRange(FIND_SOURCES);
                        if (source) {
                            const reserved = ReservationManager.shouldReserve(remoteMine, spawn);
                            BuildProjectHandoff.updateRemoteMineInMemoryForHandoff(
                                source,
                                <StructureContainer>container,
                                remoteMine,
                                reserved
                            );
                            spawn.room.createConstructionSite(container.pos.x, container.pos.y, STRUCTURE_ROAD);
                            _.remove(spawn.room.memory.buildProjects!, project);
                            if (spawn.memory.remoteHarvests) {
                                _.remove(spawn.memory.remoteHarvests, rh => {
                                    return rh.vein === source.id;
                                });
                            }
                        }
                    } else {
                        console.log("Could not identify container");
                    }
                } else {
                    console.log("Could not map container position for end of path");
                }
            } else {
                console.log("Could not identify ending path");
            }
        } else {
            console.log("Could not identify remote mine");
        }
    }

    private static updateRemoteMineInMemoryForHandoff(
        source: Source,
        container: StructureContainer,
        remoteMine: RemoteMine,
        reserved: boolean
    ) {
        remoteMine.vein = source.id;
        remoteMine.containerId = container.id;
        remoteMine.reserved = reserved;
    }

    private static handOffLocalContainerExpansion(project: BuildProject, spawn: StructureSpawn) {
        if (spawn.room.memory.containerMap) {
            // empty the map, so it will reassess.
            spawn.room.memory.containerMap = null;
        }
        buildEmptyContainerMap([], spawn.room);
        BuildProjectHandoff.clearHaulerContainerAndDropSelection(spawn.room);
        delete spawn.room.memory.dropMap;
        spawn.room.memory.lowRCLBoost = false;
        _.remove(spawn.room.memory.buildProjects!, project);
    }

    private static clearHaulerContainerAndDropSelection(room: Room) {
        for (const creep of _.filter(_.values(Game.creeps), c => {
            return c.room.name === room.name && c.memory.role === CreepRole.hauler && !c.memory.dedication;
        })) {
            creep.memory.precious = null;
            creep.memory.preciousPosition = null;
        }
    }

    private static handOffSpawnRemoteAddition(project: BuildProject, spawn: StructureSpawn) {
        if (spawn.memory.remoteHarvests) {
            _.remove(spawn.memory.remoteHarvests, rh => {
                return rh.roomName === project.roomName;
            });
        }
    }

    private static handOffLocalMineralExpansion(project: BuildProject, spawn: StructureSpawn) {
        const extractors: StructureExtractor[] = spawn.room.find<StructureExtractor>(FIND_STRUCTURES, {
            filter: s => {
                return s.structureType === STRUCTURE_EXTRACTOR;
            }
        });
        if (extractors.length > 0) {
            const container: StructureContainer | null = extractors[0].pos.findClosestByRange<StructureContainer>(
                FIND_STRUCTURES,
                {
                    filter: s => {
                        return s.structureType === STRUCTURE_CONTAINER;
                    }
                }
            );
            if (container) {
                const minerals: Mineral[] = extractors[0].pos.lookFor(LOOK_MINERALS);
                if (minerals.length > 0) {
                    spawn.room.memory.mine = {
                        extractorId: extractors[0].id,
                        containerId: container.id,
                        miner: "",
                        hauler: "",
                        type: minerals[0].mineralType,
                        vein: minerals[0].id
                    };
                }
                spawn.room.createConstructionSite(container.pos.x, container.pos.y, STRUCTURE_ROAD);
                _.remove(spawn.room.memory.buildProjects!, project);
            }
        }
    }
}
