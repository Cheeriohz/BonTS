
import { ConstructionSiteCacher } from "../caching/manager.constructionSiteCacher";
import { pruneContainerTree } from "../caching/manager.containerSelector";
import { ControllerCacher } from "../caching/manager.controllerCacher"
import { pruneSourceTree } from "../caching/manager.sourceSelector";
import { Spawn } from "../managers/manager.spawn";
import { Expander } from "../expansion/manager.expander";
import { LinkManager } from "../managers/structures/manager.links";
import { SpawnReassment } from "./manager.spawnReassessment";
import { CreepRequester } from "./manager.creepRequester";
import { ContainerExpansion } from "building/building.containerExpansion";
import { BuildProjectManager } from "building/building.buildProject";
import _ from "lodash";
import { ExpeditionResultsHandlerMapper } from "expansion/expansion.expeditionResultsHandlerMap";

export class CycleManager {

    public static check() {
        if (Memory.cycle === 0) {
            this.manageLongTermTasks();
        }
        else if (Memory.cycle % 20 === 0) {
            this.manageMediumTermTasks();
        }
        else if (Memory.cycle % 5 === 0) {
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
        ConstructionSiteCacher.dispose();
        ControllerCacher.dispose();
        this.handleRCLUpgrades(Game.spawns['Sp1']);
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
        for (const spawnName in Game.spawns) {
            const spawn = Game.spawns[spawnName];

            const expander: Expander = new Expander(spawn);
            expander.mineExpansion();

            this.cleanUpTrees(spawn.room);

            this.handleSpawnReassess(spawn);

            this.handleRCLUpgrades(spawn);

            this.handleExpeditionResultsAction(spawn);
        }
    }

    private static handleExpeditionResultsAction(spawn: StructureSpawn) {
        if (spawn.memory.expeditionResults) {
            if (spawn.memory.expeditionResults.length > 0) {
                // If we are already building, don't create another expedition build project.
                if (spawn.memory.buildProjects && spawn.memory.buildProjects.length > 0) {
                    return;
                }
                // Only ever going to process one expedition result at a time. They are very costly operations
                const expeditionResult = _.first(spawn.memory.expeditionResults);
                if (expeditionResult) {
                    const expeditionResultsHandlerMap: Map<string, IExpeditionResultsHandlerConstructor> = ExpeditionResultsHandlerMapper.getMap();
                    const ExpeditionResultsHandler = expeditionResultsHandlerMap.get(expeditionResult.name);
                    if (typeof ExpeditionResultsHandler !== 'undefined') {
                        const expeditionResultsHandler = new ExpeditionResultsHandler(expeditionResult.targetIds, expeditionResult.name);
                        expeditionResultsHandler.actionRoutine(spawn);
                    }
                    else {
                        console.log(`Could not map expeditionResultsHandler for expeditionResult: ${JSON.stringify(expeditionResult)}`);
                    }
                }
            }
        }
    }

    private static handleSpawnReassess(spawn: StructureSpawn) {
        if (spawn.memory?.reassess) {
            const reassessment: SpawnReassment = new SpawnReassment(spawn);
            reassessment.reassess();
        }
    }


    private static handleRCLUpgrades(spawn: StructureSpawn) {
        if (spawn.memory?.rclUpgrades) {
            const rclUpgradeEvent: RCLUpgradeEvent = spawn.memory.rclUpgrades[0];
            if (rclUpgradeEvent) {
                switch (rclUpgradeEvent.newRclLevel) {
                    case 6: {
                        const containerExpansion: ContainerExpansion = new ContainerExpansion(spawn, spawn.room, spawn.pos, false);
                        containerExpansion.checkForMineralExpansion();
                        _.remove(spawn.memory.rclUpgrades, rclUpgradeEvent);
                        break;
                    }
                    default: {
                        console.log(`No handling implemented for RCL Level ${rclUpgradeEvent.newRclLevel}`);
                    }
                }
            }
        }
    }

    private static spawnLevelTasksMediumTerm() {
        for (const spawnName in Game.spawns) {
            const spawn: StructureSpawn = Game.spawns[spawnName];
            if (spawn) {
                if (spawn.memory.rcl) {
                    if (spawn.memory.rcl >= 4) {
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
            if (spawn.memory.buildProjects) {
                if (spawn.memory.buildProjects.length > 0) {
                    const projectManager: BuildProjectManager = new BuildProjectManager(spawn, spawn.memory.buildProjects[0]);
                    projectManager.manageProject();
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
