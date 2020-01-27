import { CreepRole } from "enums/enum.roles";

export class DedicatedCreepRequester {
    private spawn!: StructureSpawn;

    constructor(spawn: StructureSpawn) {
        this.spawn = spawn;
    }

    public createdDedicatedCreepRequest(dedication: string, role: CreepRole, specifiedName: string) {
        if (!this.spawn.memory.dedicatedCreepRequest) {
            this.spawn.memory.dedicatedCreepRequest = [];
        }
        switch (role) {
            case CreepRole.dropper: {
                this.spawn.memory.dedicatedCreepRequest.push(this.createDedicatedDropper(dedication, specifiedName));
                break;
            }
            case CreepRole.hauler: {
                this.spawn.memory.dedicatedCreepRequest.push(this.createDedicatedHauler(dedication, specifiedName));
                break;
            }
            default: {
                console.log(`Cannot created dedicated creep of role: ${CreepRole[role]}`);
            }
        }
    }

    private createDedicatedDropper(dedication: string, specifiedName: string): DedicatedCreepRequest {
        return { role: CreepRole.dropper, body: [WORK, WORK, WORK, WORK, WORK, WORK, MOVE], dedication: dedication, specifiedName: specifiedName, memory: null };
    }

    private createDedicatedHauler(dedication: string, specifiedName: string): DedicatedCreepRequest {
        return { role: CreepRole.hauler, body: [CARRY, CARRY, CARRY, MOVE, MOVE, MOVE], dedication: dedication, specifiedName: specifiedName, memory: null };
    }


}
