// Managers
import { CycleManager } from "cycle/manager.cycle";
import { RolesManager } from "managers/manager.roles";
import { Spawn } from "managers/manager.spawn";
import { TowerManager } from "managers/structures/manager.towers";
import { MineManager } from "./manager.mine";
import _ from "lodash";

export class GameManager {

    public static run() {
        this.runClean();
        // this.runLogging();
    }

    private static runClean() {
        const executionTime = Game.cpu.getUsed();
        // Spawn creeps
        Spawn.run();

        // Manage roles
        const rm: RolesManager = new RolesManager();
        rm.run();

        // Manage mines
        if (Memory.cycle % 50 === 0) {
            for (const spawn of _.values(Game.spawns)) {
                if (spawn.room.memory.mine) {
                    const mm: MineManager = new MineManager(spawn.room, spawn);
                    mm.manageMine(true);
                }
            }
        }

        // Manage structures
        TowerManager.run();

        // Manage cycles
        CycleManager.check();
        console.log(`Cycle ${Memory.cycle} Execution Time: ${Game.cpu.getUsed() - executionTime}`);
    }

    private static runLogging() {
        const executionTime = Game.cpu.getUsed();

        // Spawn creeps
        Spawn.run();

        const executionTimeSpawner = Game.cpu.getUsed();

        // Manage roles
        const rm: RolesManager = new RolesManager();
        rm.run();

        const executionTimeRoles = Game.cpu.getUsed();

        // Manage structures
        TowerManager.run();

        const executionTimeStructures = Game.cpu.getUsed();

        // Manage cycles
        CycleManager.check();

        const executionTimeCycles = Game.cpu.getUsed();


        console.log(`Cycle ${Memory.cycle} Execution Time: ${executionTimeCycles - executionTime}`);
        console.log(`   Spawning: ${executionTimeSpawner - executionTime}`);
        console.log(`   Roles: ${executionTimeRoles - executionTimeSpawner}`);
        console.log(`   Structures: ${executionTimeStructures - executionTimeRoles}`);
        console.log(`   Cycles: ${executionTimeCycles - executionTimeStructures}`);

    }

}
