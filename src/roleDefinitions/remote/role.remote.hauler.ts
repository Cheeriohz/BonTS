import { RemoteMineHandler } from "remote/remote.remoteMineHandler";
import { RoleRemote } from "roleDefinitions/base/role.remote";

export class RoleRemoteHauler extends RoleRemote {
    public run(creep: Creep) {
        let dispatchPath = null;
        if (creep.memory.working && creep.store.getUsedCapacity() === 0) {
            creep.memory.working = false;
            creep.say('🏗️ pickup');
        }
        if (!creep.memory.working && creep.store.getFreeCapacity() === 0) {
            creep.memory.working = true;
            creep.say('💦');
        }

        if (creep.memory.working) {
            this.depositRemoteHaul(creep);
        }
        else {
            this.withdrawRemote(creep);
        }
    }

    protected depositRemoteHaul(creep: Creep) {
        if (creep.memory.home !== creep.room.name) {
            this.travelToRoom(creep, creep.memory.home!, true);
        }
        else {
            const storage: StructureStorage | undefined = this.checkStorageForDeposit(creep.room);
            if (storage) {
				this.depositMove(creep, storage);
				this.repairRoad(creep);
            }
        }
    }

    protected withdrawRemote(creep: Creep) {
        if (creep.memory.orders!.target !== creep.room.name) {
            this.travelToRoom(creep, creep.memory.orders!.target, false);
        }
        else {
            const container: Structure | null = Game.getObjectById(creep.memory.dedication!);
            if (container) {
                this.withdrawMove(creep, container);
            }
        }
    }
}
