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
import { SquadManager } from "military/military.squadManager";
import { SquadBuilder } from "military/military.squadBuilder";
import { SquadTypes } from "enums/enum.squads";
import { TheatreDrafting } from "military/military.theatreDrafting";

export class GameManager {
    public static run() {
        if (Memory.cycle >= __cycle_long_term__) {
            Memory.cycle = 0;
        } else {
            Memory.cycle++;
        }
        if (Memory.gameManagerLog) {
            this.runLogging();
        } else {
            this.runClean();
        }
    }

    private static runClean() {
        const executionTime = Game.cpu.getUsed();
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

        // Manage cycle intermittent pre-and post actions
        CycleManager.checkPre();

        // Manage Squads
        const squadManager: SquadManager = new SquadManager();
        squadManager.manageSquads();

        // Spawn creeps
        Spawn.run();

        // Manage roles
        const rm: RolesManager = new RolesManager();
        rm.run();

        // Manage structures
        TowerManager.run();

        // Manage cycles
        CycleManager.checkPost();
        if (Memory.cycleLog) {
            console.log(`Cycle ${Memory.cycle} Execution Time: ${Game.cpu.getUsed() - executionTime}`);
        }
    }

    private static runLogging() {
        const executionTime = Game.cpu.getUsed();
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

        const executionTimeRemote = Game.cpu.getUsed();
        // Manage cycle intermittent pre-and post actions
        CycleManager.checkPre();

        const executionTimeCheckPre = Game.cpu.getUsed();

        // Manage Squads
        const squadManager: SquadManager = new SquadManager();
        squadManager.manageSquads();
        const executionTimeSquad = Game.cpu.getUsed();

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
        CycleManager.checkPost();

        const executionTimeCycles = Game.cpu.getUsed();

        console.log(`Cycle ${Memory.cycle} Execution Time: ${executionTimeCycles - executionTime}`);
        console.log(`   Remotes: ${executionTimeSpawner - executionTimeRemote}`);
        console.log(`   CheckPre: ${executionTimeRemote - executionTimeSquad}`);
        console.log(`   Squads: ${executionTimeSquad - executionTimeCheckPre}`);
        console.log(`   Spawning: ${executionTimeSpawner - executionTime}`);
        console.log(`   Roles: ${executionTimeRoles - executionTimeSpawner}`);
        console.log(`   Structures: ${executionTimeStructures - executionTimeRoles}`);
        console.log(`   CheckPost: ${executionTimeCycles - executionTimeStructures}`);
    }

    private static manageRemotes(spawn: StructureSpawn) {
        this.manageRemoteReservations(spawn);
        this.manageRemoteMines(spawn);
        this.manageRemoteHarvests(spawn);
        this.manageRoomHarass(spawn);
        this.managePatrol(spawn);
        this.manageTheatres(spawn);
    }

    private static manageTheatres(spawn: StructureSpawn) {
        if (spawn.room.memory.theatres && spawn.room.memory.theatres.length > 0) {
            for (const theatreName of spawn.room.memory.theatres) {
                TheatreDrafting.draftSquad(spawn, theatreName);
            }
        }
    }

    private static managePatrol(spawn: StructureSpawn) {
        if (spawn.room.memory.remotePatrols && spawn.room.memory.remotePatrols.length > 0) {
            for (const remotePatrol of spawn.room.memory.remotePatrols) {
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
}
