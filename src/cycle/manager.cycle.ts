import { ConstructionSiteCacher } from "../caching/manager.constructionSiteCacher";
import { pruneContainerTree } from "../caching/manager.containerSelector";
import { ControllerCacher } from "../caching/manager.controllerCacher";
import { pruneSourceTree } from "../caching/manager.sourceSelector";
import { Spawn } from "../spawning/manager.spawn";
import { Expander } from "../expansion/manager.expander";
import { LinkManager } from "../managers/structures/manager.links";
import { SpawnReassment } from "./manager.spawnReassessment";
import { CreepRequester } from "../spawning/manager.creepRequester";
import { LocalExpansion } from "building/building.LocalExpansion";
import { BuildProjectManager } from "building/building.buildProject";
import _ from "lodash";
import { ExpeditionResultsHandlerMapper } from "expansion/expansion.expeditionResultsHandlerMap";
import { RCLUpgradeHandler } from "./manager.handleRCLUpgrades";
import { ExtensionAddition } from "building/building.extensionAddition";
import { Visualizer } from "building/building.visualizer";
import { BorderAggression } from "military/military.borderAggression";

export class CycleManager {
    public static check() {
        if (Memory.cycle === 0) {
            this.manageLongTermTasks();
        } else if (Memory.cycle % 20 === 0) {
            this.manageMediumTermTasks();
        } else if (Memory.cycle % 5 === 0) {
            this.manageShortTermTasks();
        }
        this.everyCycle();
    }

    private static manageLongTermTasks() {
        this.roomLevelTasksLongTerm();
        this.spawnLevelTasksLongTerm();
        this.manageMediumTermTasks();
    }

    private static manageMediumTermTasks() {
        this.spawnLevelTasksMediumTerm();
        this.manageShortTermTasks();
    }

    private static manageShortTermTasks() {
        this.spawnLevelTasksShortTerm();
        this.updateSpawnConstructionSiteMaps();
        // Global Creep Map
        Spawn.populateCreepCounts();
    }

    private static everyCycle() {
        CycleManager.drawReservedConstruction();
        ConstructionSiteCacher.dispose();
        ControllerCacher.dispose();
    }

    private static drawReservedConstruction() {
        if (Memory.showReserved) {
            const vis = new Visualizer();
            for (const room of _.values(Game.rooms)) {
                if (room.memory.reservedBuilds) {
                    vis.drawBuildOrders(room.memory.reservedBuilds, room.name);
                }
            }
        }
    }

    private static updateSpawnConstructionSiteMaps() {
        for (const spawn in Game.spawns) {
            ConstructionSiteCacher.updateConstructionSites(Game.spawns[spawn].room);
        }
    }

    private static roomLevelTasksLongTerm() {
        for (const room in Game.rooms) {
            this.storeControllerIds(Game.rooms[room]);
        }
    }

    private static spawnLevelTasksLongTerm() {
        for (const spawn of _.values(Game.spawns)) {
            this.cleanUpTrees(spawn.room);

            this.handleSpawnReassess(spawn);

            RCLUpgradeHandler.handleRCLUpgrades(spawn);

            this.handleExpeditionResultsAction(spawn);
        }
    }

    private static borderAgressionTest() {
        const ba: BorderAggression = new BorderAggression(Game.spawns["A"]);
        ba.HandleTrivialNeighbors();
    }

    private static handleExpeditionResultsAction(spawn: StructureSpawn) {
        if (spawn.memory.expeditionResults) {
            if (spawn.memory.expeditionResults.length > 0) {
                // If we are already building, don't create another expedition build project.
                if (spawn.room.memory.buildProjects && spawn.room.memory.buildProjects.length > 0) {
                    return;
                }
                // Only ever going to process one expedition result at a time. They are very costly operations
                const expeditionResult = _.first(spawn.memory.expeditionResults);
                if (expeditionResult) {
                    const expeditionResultsHandlerMap: Map<
                        string,
                        IExpeditionResultsHandlerConstructor
                    > = ExpeditionResultsHandlerMapper.getMap();
                    const ExpeditionResultsHandler = expeditionResultsHandlerMap.get(expeditionResult.name);
                    if (typeof ExpeditionResultsHandler !== "undefined") {
                        const expeditionResultsHandler = new ExpeditionResultsHandler(
                            expeditionResult.targets,
                            expeditionResult.name
                        );
                        expeditionResultsHandler.actionRoutine(spawn);
                    } else {
                        console.log(
                            `Could not map expeditionResultsHandler for expeditionResult: ${JSON.stringify(
                                expeditionResult
                            )}`
                        );
                    }
                }
            }
        }
    }

    private static handleSpawnReassess(spawn: StructureSpawn) {
        const reassessment: SpawnReassment = new SpawnReassment(spawn);
        reassessment.reassess();
    }

    private static spawnLevelTasksMediumTerm() {
        for (const spawnName in Game.spawns) {
            const spawn: StructureSpawn = Game.spawns[spawnName];
            if (spawn) {
                if (spawn.room.memory.rcl) {
                    if (spawn.room.memory.rcl >= 4) {
                        const creepRequester: CreepRequester = new CreepRequester(spawn);
                        creepRequester.CheckForRepairNeed();
                    }
                }
            }
        }
    }

    private static spawnLevelTasksShortTerm() {
        const linkManager: LinkManager = new LinkManager();
        for (const spawnName in Game.spawns) {
            const spawn = Game.spawns[spawnName];
            linkManager.balanceEnergyForSpawn(spawn);
            if (spawn.room.memory.buildProjects) {
                if (spawn.room.memory.buildProjects.length > 0) {
                    if (spawn.room.storage && spawn.room.storage.store.getUsedCapacity(RESOURCE_ENERGY) > 50000) {
                        for (const bp of spawn.room.memory.buildProjects) {
                            const projectManager: BuildProjectManager = new BuildProjectManager(spawn, bp);
                            projectManager.manageProject();
                        }
                    } else {
                        const projectManager: BuildProjectManager = new BuildProjectManager(
                            spawn,
                            spawn.room.memory.buildProjects[0]
                        );
                        projectManager.manageProject();
                    }
                }
            }
        }
    }

    private static cleanUpTrees(room: Room) {
        pruneSourceTree(room);
        pruneContainerTree(room);
    }

    private static storeControllerIds(room: Room) {
        ControllerCacher.checkForController(room);
    }
}
