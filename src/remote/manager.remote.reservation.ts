import { DedicatedCreepRequester } from "spawning/manager.dedicatedCreepRequester";
import { CreepRole } from "enums/enum.roles";

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
        const reserverName: string = `reserver${this.reservation.roomName}${Game.time.toPrecision(8)}`;
        const dcr: DedicatedCreepRequester = new DedicatedCreepRequester(this.spawn);
        dcr.createdDedicatedCreepRequest({
            dedication: this.reservation.roomName,
            role: CreepRole.reserver,
            specifiedName: reserverName,
            precious: undefined,
            isRemote: true,
            orders: undefined
        });
        this.reservation.spawnTime = gameTime;
    }
}

interface RemoteReservation {
    roomName: string;
    spawnTime: number;
    leadTime: number;
}
