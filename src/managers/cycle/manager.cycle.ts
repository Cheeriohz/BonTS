
import { ConstructionSiteCacher } from "../caching/manager.constructionSiteCacher";
import { pruneContainerTree } from "../caching/manager.containerSelector";
import { ControllerCacher } from "../caching/manager.controllerCacher"
import { pruneSourceTree } from "../caching/manager.sourceSelector";
import { Spawn } from "../manager.spawn";
import { Expander } from "../expansion/manager.expander";
import { LinkManager } from "../structures/manager.links";
import { SpawnReassment } from "./manager.spawnReassessment";
import { CreepRequester } from "./manager.creepRequester";
import { ContainerExpansion } from "building/building.containerExpansion";
import { BuildProjectManager } from "building/building.buildProject";
import _ from "lodash";

export class CycleManager {

    public static check() {
        if (Memory.cycle > 99) {
            this.manageLongTermTasks();
            Memory.cycle = 0;
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
        Memory.cycle++;
    }

    private static updateSpawnConstructionSiteMaps() {
        for (const spawn in Game.spawns) {
            ConstructionSiteCacher.updateConstructionSites(Game.spawns[spawn].room);
        }
    }

    private static roomLevelTasksLongTerm() {
        for (const room in Game.rooms) {
            this.cleanUpTrees(Game.rooms[room]);
            this.storeControllerIds(Game.rooms[room]);
        }
    }

    private static spawnLevelTasksLongTerm() {
        for (const spawnName in Game.spawns) {
            const spawn = Game.spawns[spawnName];
            const expander: Expander = new Expander(spawn);
            expander.mineExpansion();
            if (spawn.memory?.reassess) {
                const reassessment: SpawnReassment = new SpawnReassment(spawn);
                reassessment.reassess();
            }
            this.handleRCLUpgrades(spawn);
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
