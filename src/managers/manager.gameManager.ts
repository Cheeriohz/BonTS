// Managers
import { CycleManager } from "cycle/manager.cycle";
import { RolesManager } from "managers/manager.roles";
import { Spawn } from "spawning/manager.spawn";
import { TowerManager } from "managers/structures/manager.towers";
import { MineManager } from "./manager.mine";
import _ from "lodash";
import { RemoteMineManager } from "remote/manager.remote.remoteMine";
import { CreepRequester } from "spawning/manager.creepRequester";
import { RemoteHarvestManager } from "remote/manager.remote.remoteHarvest";
import { ReservationManager } from "remote/manager.remote.reservation";
import { RoomHarassManager } from "remote/manager.remote.roomHarrass";
import { RemotePatrolManager } from "remote/manager.remote.patrol";

export class GameManager {
    public static run() {
        if (Memory.cycle >= __cycle_long_term__) {
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

        // Manage remotes and mines.
        if (Memory.cycle % __cycle_medium_term__ === 0) {
            for (const spawn of _.uniqBy(_.values(Game.spawns), s => s.room.name)) {
                if (spawn.room.memory.mine) {
                    const mm: MineManager = new MineManager(spawn.room, spawn);
                    mm.manageMine(true);
                }
                GameManager.manageRemotes(spawn);
            }
        }

        // Manage structures
        TowerManager.run();

        // Manage cycles
        CycleManager.check();
        console.log(`Cycle ${Memory.cycle} Execution Time: ${Game.cpu.getUsed() - executionTime}`);
    }

    private static manageRemotes(spawn: StructureSpawn) {
        // TODO this could use major refactoring
        this.manageRemoteReservations(spawn);
        this.manageRemoteMines(spawn);
        this.manageRemoteHarvests(spawn);
        this.manageRoomHarass(spawn);
        this.managePatrol(spawn);
    }

    private static managePatrol(spawn: StructureSpawn) {
        if (spawn.memory.remotePatrols && spawn.memory.remotePatrols.length > 0) {
            for (const remotePatrol of spawn.memory.remotePatrols) {
                const remotePatrolManager: RemotePatrolManager = new RemotePatrolManager(spawn, remotePatrol);
                remotePatrolManager.managePatrol();
            }
        }
    }

    private static manageRoomHarass(spawn: StructureSpawn) {
        if (spawn.memory.roomHarass && spawn.memory.roomHarass.length > 0) {
            for (const roomHarass of spawn.memory.roomHarass) {
                const harrassmentManager: RoomHarassManager = new RoomHarassManager(spawn, roomHarass);
                harrassmentManager.manageHarass();
            }
        }
    }

    private static manageRemoteReservations(spawn: StructureSpawn) {
        if (spawn.room.memory.remoteReservations && spawn.room.memory.remoteReservations.length > 0) {
            for (const reservation of spawn.room.memory.remoteReservations) {
                const reservationManager: ReservationManager = new ReservationManager(reservation, spawn);
                reservationManager.manageReservation();
            }
        }
    }

    private static manageRemoteMines(spawn: StructureSpawn) {
        if (spawn.room.memory.remoteMines && spawn.room.memory.remoteMines.length > 0) {
            for (const remoteMine of spawn.room.memory.remoteMines) {
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
