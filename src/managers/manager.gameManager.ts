// Managers
import { CycleManager } from "managers/manager.cycle";
import { RolesManager } from "managers/manager.roles";
import { Spawn } from "managers/manager.spawn";
import { TowerManager } from "managers/manager.towers";

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
