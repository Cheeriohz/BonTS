// Managers
import { CycleManager } from "cycle/manager.cycle";
import { RolesManager } from "managers/manager.roles";
import { Spawn } from "managers/manager.spawn";
import { TowerManager } from "managers/structures/manager.towers";
import { MineManager } from "./manager.mine";
import _ from "lodash";
import { RemoteMineManager } from "remote/manager.remote.remoteMine";
import { CreepRequester } from "cycle/manager.creepRequester";
import { RemoteHarvestManager } from "remote/manager.remote.remoteHarvest";
import { ReservationManager } from "remote/manager.remote.reservation";

export class GameManager {
    public static run() {
        if (Memory.cycle > 99) {
            Memory.cycle = 0;
        } else {
            Memory.cycle++;
        }

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
        if (Memory.cycle % 25 === 0) {
            for (const spawn of _.values(Game.spawns)) {
                if (spawn.room.memory.mine) {
                    const mm: MineManager = new MineManager(spawn.room, spawn);
                    mm.manageMine(true);
                }
                if (!Memory.killswitch) {
                    GameManager.manageRemotes(spawn);
                }
            }
        }

        // Manage structures
        TowerManager.run();

        // Manage cycles
        CycleManager.check();
        console.log(`Cycle ${Memory.cycle} Execution Time: ${Game.cpu.getUsed() - executionTime}`);
    }

    private static manageRemotes(spawn: StructureSpawn) {
        this.manageRemoteReservations(spawn);
        this.manageRemoteMines(spawn);
        this.manageRemoteHarvests(spawn);
    }

    private static manageRemoteReservations(spawn: StructureSpawn) {
        if (spawn.memory.remoteReservations && spawn.memory.remoteReservations.length > 0) {
            for (const reservation of spawn.memory.remoteReservations) {
                const reservationManager: ReservationManager = new ReservationManager(reservation, spawn);
                reservationManager.manageReservation();
            }
        }
    }

    private static manageRemoteMines(spawn: StructureSpawn) {
        if (spawn.memory.remoteMines && spawn.memory.remoteMines.length > 0) {
            for (const remoteMine of spawn.memory.remoteMines) {
                if (remoteMine.containerId) {
                    const containerRoomName = _.last(_.keys(remoteMine.pathingLookup));
                    if (containerRoomName) {
                        // check to see if we have room visibility to manage
                        const containerRoom = Game.rooms[containerRoomName];
                        if (containerRoom) {
                            const remoteMineManager: RemoteMineManager = new RemoteMineManager(
                                containerRoom,
                                spawn,
                                remoteMine
                            );
                            remoteMineManager.manageMine(true);
                        } else {
                            const cr: CreepRequester = new CreepRequester(spawn);
                            cr.RequestScoutToRoom(containerRoomName);
                        }
                    }
                }
            }
        }
    }

    private static manageRemoteHarvests(spawn: StructureSpawn) {
        if (spawn.memory.remoteHarvests && spawn.memory.remoteHarvests.length > 0) {
            for (const remoteHarvest of spawn.memory.remoteHarvests) {
                if (remoteHarvest.vein) {
                    const remoteHarvestManager: RemoteHarvestManager = new RemoteHarvestManager(spawn, remoteHarvest);
                    remoteHarvestManager.manageharvest(true);
                }
            }
        }
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
