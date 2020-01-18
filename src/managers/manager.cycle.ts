import { containerSelector } from "managers/manager.containerSelector";
import { sourceSelector } from "managers/manager.sourceSelector";
import { constructionManager } from "managers/manager.constructionManager";

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
        this.cleanUpTrees();
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

    private static cleanUpTrees() {
        for (const room in Game.rooms) {
            sourceSelector.externalClean(Game.rooms[room]);
            containerSelector.externalClean(Game.rooms[room]);
        }
    }

}
