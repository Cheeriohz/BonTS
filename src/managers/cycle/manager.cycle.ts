
import { ConstructionSiteCacher } from "../caching/manager.constructionSiteCacher";
import { pruneContainerTree } from "../caching/manager.containerSelector";
import { ControllerCacher } from "../caching/manager.controllerCacher"
import { pruneSourceTree } from "../caching/manager.sourceSelector";
import { Spawn } from "../manager.spawn";
import { TerrainScanner } from "../building/manager.terrainScanner";
import { Expander } from "../building/manager.expander";
import { LinkManager } from "../structures/manager.links";

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
        const linkManager: LinkManager = new LinkManager();
        for (const spawnName in Game.spawns) {
            const spawn = Game.spawns[spawnName];
            expander.mineExpansion(spawn);
            if (spawn.memory?.reassess) {
                linkManager.populateLinkMemory(spawn);
                spawn.memory.reassess = false;
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
