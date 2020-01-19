
import { ConstructionSiteCacher } from "./manager.constructionSiteCacher";
import { pruneContainerTree } from "./manager.containerSelector";
import { ControllerCacher } from "./manager.controllerCacher"
import { pruneSourceTree } from "./manager.sourceSelector";
import { Spawner } from "./manager.spawner";




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
        this.manageMediumTermTasks();
    }

    private static manageMediumTermTasks() {
        this.manageShortTermTasks();
    }

    private static manageShortTermTasks() {
        this.updateSpawnConstructionSiteMaps();
        Spawner.populateCreepCounts();
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

    private static cleanUpTrees(room: Room) {
        pruneSourceTree(room);
        pruneContainerTree(room);
    }

    private static storeControllerIds(room: Room) {
        ControllerCacher.checkForController(room);
    }

}
