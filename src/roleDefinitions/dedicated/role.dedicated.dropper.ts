import { RoleDropper } from "roleDefinitions/role.dropper";

export class RoleDedicatedDropper extends RoleDropper {

    public runDedicated(creep: Creep, dedication: string) {
        if (creep.memory.working) {
            super.harvest(creep);
        }
        else {
            this.dedicatedRelocate(creep, dedication);
        }
    }

    private dedicatedRelocate(creep: Creep, dedication: string) {
        const container = Game.getObjectById<StructureContainer>(dedication);
        if (container) {
            if (creep.pos.x === container.pos.x && creep.pos.y === container.pos.y) {
                this.updateDedicatedPrecious(creep);
                creep.memory.working = true;
            }
            else {
                creep.moveTo(container);
            }
        }
    }

    private updateDedicatedPrecious(creep: Creep) {
        if (creep.room.memory.mine) {
            const vein: Structure | null = Game.getObjectById(creep.room.memory.mine.vein);
            if (vein) {
                creep.memory.precious = vein.id;
            }
        }
    }


}
