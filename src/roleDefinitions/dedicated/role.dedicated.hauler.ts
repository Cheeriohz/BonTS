import { RoleHauler } from "roleDefinitions/role.hauler";

export class RoleDedicatedHauler extends RoleHauler {


    public runDedicated(creep: Creep, dedication: string) {
        if (creep.memory.working && creep.store.getUsedCapacity() === 0) {
            creep.memory.working = false;
            creep.say('🏗️ pickup');
        }
        if (!creep.memory.working && creep.store.getFreeCapacity() === 0) {
            creep.memory.working = true;
            creep.say('💦');
        }

        if (creep.memory.working) {
            this.depositDedicatedHaul(creep);
        }
        else {
            this.withdrawFromDedication(creep, dedication);
        }

    }

    protected depositDedicatedHaul(creep: Creep) {
        const storage: StructureStorage | undefined = this.checkStorageForDeposit(creep.room);
        if (storage) {
            const resourceType: MineralConstant | DepositConstant | undefined = creep.room.memory.mine?.type;
            if (resourceType) {
                this.depositMoveSpecified(creep, storage, resourceType);
            }
        }
    }

    protected withdrawFromDedication(creep: Creep, dedication: string) {
        const container: Structure | null = Game.getObjectById(dedication);
        if (container) {
            const resourceType: MineralConstant | DepositConstant | undefined = creep.room.memory.mine?.type;
            console.log(resourceType);
            if (resourceType) {
                this.withdrawMoveSpecified(creep, container, resourceType);
            }

        }
    }

}
