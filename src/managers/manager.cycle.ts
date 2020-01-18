import { containerSelector } from "managers/manager.containerSelector";
import { sourceSelector } from "managers/manager.sourceSelector";

export class cycleManager {

    public static check() {
        if (Memory.cycle > 99) {
            this.manageLongTermTasks();
            Memory.cycle = 0;
        }
        Memory.cycle++;
    }

    private static manageLongTermTasks() {
        this.cleanUpTrees();
    }

    private static cleanUpTrees() {
        for (const room in Game.rooms) {
            sourceSelector.externalClean(Game.rooms[room]);
            containerSelector.externalClean(Game.rooms[room]);
        }
    }

}
