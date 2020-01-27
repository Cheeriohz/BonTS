import { CreepRole } from "enums/enum.roles";

// This requester is for dedicated tasks. Maintaining and regulating requests is to be done externally to the class.
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
            case CreepRole.builder: {
                this.spawn.memory.dedicatedCreepRequest.push(this.createDedicatedBuilder(dedication, specifiedName));
                break;
            }
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

    private createDedicatedBuilder(dedication: string, specifiedName: string): DedicatedCreepRequest {
        return { role: CreepRole.builder, body: [WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE], dedication: dedication, specifiedName: specifiedName, memory: null };
    }

    private createDedicatedDropper(dedication: string, specifiedName: string): DedicatedCreepRequest {
        return { role: CreepRole.dropper, body: [WORK, WORK, WORK, WORK, WORK, WORK, MOVE], dedication: dedication, specifiedName: specifiedName, memory: null };
    }

    private createDedicatedHauler(dedication: string, specifiedName: string): DedicatedCreepRequest {
        return { role: CreepRole.hauler, body: [CARRY, CARRY, CARRY, MOVE, MOVE, MOVE], dedication: dedication, specifiedName: specifiedName, memory: null };
    }


}
