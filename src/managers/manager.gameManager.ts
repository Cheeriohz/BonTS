//Mangers
import { spawner } from "managers/manager.spawner";

import { rolesManager } from "managers/manager.roles";
import { towerManager } from "managers/manager.towers";
import { cycleManager } from "managers/manager.cycle";

export class gameManager {

    public static run() {
        //this.runClean();
        this.runLogging();
    }

    private static runClean() {
        //Spawn creeps
        spawner.run();

        //Manage roles
        rolesManager.run();

        //Manage structures
        towerManager.run();

        //Manage cycles
        cycleManager.check();
    }

    private static runLogging() {
        let executionTime = Game.cpu.getUsed();

        //Spawn creeps
        spawner.run();

        let executionTimeSpawner = Game.cpu.getUsed();

        //Manage roles
        rolesManager.run();

        let executionTimeRoles = Game.cpu.getUsed();

        //Manage structures
        towerManager.run();

        let executionTimeStructures = Game.cpu.getUsed();

        //Manage cycles
        cycleManager.check();

        let executionTimeCycles = Game.cpu.getUsed();


        console.log(`Cycle ${Memory.cycle} Execution Time: ${executionTimeCycles - executionTime}`);
        console.log(`   Spawning: ${executionTimeSpawner - executionTime}`);
        console.log(`   Roles: ${executionTimeRoles - executionTimeSpawner}`);
        console.log(`   Structures: ${executionTimeStructures - executionTimeRoles}`);
        console.log(`   Cycles: ${executionTimeCycles - executionTimeStructures}`);

    }

}
