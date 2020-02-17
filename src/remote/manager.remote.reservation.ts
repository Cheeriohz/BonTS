import { DedicatedCreepRequester } from "spawning/manager.dedicatedCreepRequester";
import { CreepRole } from "enums/enum.roles";
import _ from "lodash";

const reserverThreshold: number = 1200;

export class ReservationManager {
    private reservation!: RemoteReservation;
    private spawn!: StructureSpawn;

    constructor(reservation: RemoteReservation, spawn: StructureSpawn) {
        this.reservation = reservation;
        this.spawn = spawn;
    }

    public manageReservation() {
        // This is verbose, but I know I will need a better system.

        const gameTime = Game.time;
        const timeSinceSpawn = gameTime - this.reservation.spawnTime;
        const timeSinceSpawnWithLead = timeSinceSpawn + this.reservation.leadTime;
        const timeSinceSpawnWithLeadAndFudge = timeSinceSpawnWithLead + 50;

        if (timeSinceSpawnWithLeadAndFudge > reserverThreshold) {
            this.requestReserver(gameTime);
        }
    }

    private requestReserver(gameTime: number) {
        const reserverName: string = `reserver${this.reservation.roomName}${Memory.creepTicker}`;
        Memory.creepTicker++;
        const orders: ReserverOrder = {
            target: this.reservation.roomName,
            independentOperator: false,
            reserving: true,
            claiming: false,
            downgrading: false
        };
        const dcr: DedicatedCreepRequester = new DedicatedCreepRequester(this.spawn);
        dcr.createdDedicatedCreepRequest({
            dedication: this.reservation.roomName,
            role: CreepRole.reserver,
            specifiedName: reserverName,
            precious: undefined,
            isRemote: true,
            orders: orders
        });
        this.reservation.spawnTime = gameTime;
    }

    public static shouldReserve(remoteMine: RemoteMine, spawn: StructureSpawn): boolean {
        let travelDistance = 0;
        for (const pathStep of _.values(remoteMine.pathingLookup)) {
            travelDistance += pathStep[0].length;
        }
        if (travelDistance < 100) {
            const remoteReservation: RemoteReservation = {
                roomName: remoteMine.roomName,
                spawnTime: Game.time + 2000,
                leadTime: travelDistance + 20
            };
            if (spawn.room.memory.remoteReservations) {
                spawn.room.memory.remoteReservations.push(remoteReservation);
            } else {
                spawn.room.memory.remoteReservations = [remoteReservation];
            }
            return true;
        }
        return false;
    }
}

interface RemoteReservation {
    roomName: string;
    spawnTime: number;
    leadTime: number;
}
