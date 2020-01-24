
import { ConstructionSiteCacher } from "../caching/manager.constructionSiteCacher";
import { pruneContainerTree } from "../caching/manager.containerSelector";
import { ControllerCacher } from "../caching/manager.controllerCacher"
import { pruneSourceTree } from "../caching/manager.sourceSelector";
import { Spawn } from "../manager.spawn";
import { TerrainScanner } from "../building/manager.terrainScanner";
import { Expander } from "../expansion/manager.expander";
import { LinkManager } from "../structures/manager.links";
import { SpawnReassment } from "./manager.spawnReassessment";
import { ExpeditionManager } from "managers/expansion/manager.expedition";
import { CreepRequester } from "./manager.creepRequester";

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
        const expander: Expander = new Expander();
        for (const spawnName in Game.spawns) {
            const spawn = Game.spawns[spawnName];
            expander.mineExpansion(spawn);
            if (spawn.memory?.reassess) {
                const reassessment: SpawnReassment = new SpawnReassment(spawn);
                reassessment.reassess();
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
        for (const spawn in Game.spawns) {
            linkManager.balanceEnergyForSpawn(Game.spawns[spawn]);
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
