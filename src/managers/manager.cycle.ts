import { containerSelector } from "managers/manager.containerSelector";
import { sourceSelector } from "managers/manager.sourceSelector";
import { constructionManager } from "managers/manager.constructionManager";
import { controllerObjectManager } from "managers/manager.controllerObjectManager"

export class cycleManager {

    public static check() {
        if (Memory.cycle > 99) {
            this.manageLongTermTasks();
            Memory.cycle = 0;
        }
        else if (Memory.cycle % 20 == 0) {
            this.manageMediumTermTasks();
        }
        else if (Memory.cycle % 5 == 0) {
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
    }

    private static everyCycle() {
        constructionManager.dispose();
        Memory.cycle++;
    }

    private static updateSpawnConstructionSiteMaps() {
        for (const spawn in Game.spawns) {
            constructionManager.updateConstructionSites(Game.spawns[spawn].room);
        }
    }

    private static roomLevelTasksLongTerm() {
        for (const room in Game.rooms) {
            this.cleanUpTrees(Game.rooms[room]);
            this.storeControllerIds(Game.rooms[room]);
        }
    }

    private static cleanUpTrees(room: Room) {
        sourceSelector.externalClean(room);
        containerSelector.externalClean(room);
    }

    private static storeControllerIds(room: Room) {
        controllerObjectManager.checkForController(room);
    }

}
