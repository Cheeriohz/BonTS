import { CreepRole } from "enums/enum.roles";

// This requester is for dedicated tasks. Maintaining and regulating requests is to be done externally to the class.
export class DedicatedCreepRequester {
    private spawn!: StructureSpawn;

    constructor(spawn: StructureSpawn) {
        this.spawn = spawn;
    }



    public createdDedicatedCreepRequest(dedication: string, role: CreepRole, specifiedName: string, precious?: string, isRemote?: boolean, orders?: CreepOrder) {
        if (!this.spawn.memory.dedicatedCreepRequest) {
            this.spawn.memory.dedicatedCreepRequest = [];
        }
        switch (role) {
            case CreepRole.builder: {
                if (isRemote) {
                    this.spawn.memory.dedicatedCreepRequest.push(this.createDedicatedRemoteBuilder(dedication, specifiedName));
                }
                break;
            }
            case CreepRole.dropper: {
                if (isRemote) {
                    this.spawn.memory.dedicatedCreepRequest.push(this.createDedicatedRemoteDropper(dedication, specifiedName, precious, orders));
                }
                else {
                    this.spawn.memory.dedicatedCreepRequest.push(this.createDedicatedDropper(dedication, specifiedName, precious));
                }
                break;
            }
            case CreepRole.hauler: {
                if (isRemote) {
                    this.spawn.memory.dedicatedCreepRequest.push(this.createDedicatedRemoteHauler(dedication, specifiedName, precious, orders));
                }
                this.spawn.memory.dedicatedCreepRequest.push(this.createDedicatedHauler(dedication, specifiedName));
                break;
            }
            default: {
                console.log(`Cannot created dedicated creep of role: ${CreepRole[role]}`);
            }
        }
    }

    private createDedicatedRemoteBuilder(dedication: string, specifiedName: string): DedicatedCreepRequest {
        return {
            role: CreepRole.builder,
            body: [WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE],
            dedication: dedication,
            specifiedName: specifiedName,
            home: this.spawn.room.name
        };
    }

    private createDedicatedRemoteDropper(dedication: string, specifiedName: string, precious?: string, orders?: CreepOrder): DedicatedCreepRequest {
        return {
            role: CreepRole.dropper,
            body: [WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE],
            dedication: dedication,
            specifiedName: specifiedName,
            precious: precious,
            home: this.spawn.room.name,
            orders: orders
        };
    }

    private createDedicatedRemoteHauler(dedication: string, specifiedName: string, precious?: string, orders?: CreepOrder): DedicatedCreepRequest {
        return {
            role: CreepRole.dropper,
            body: [CARRY, CARRY, CARRY, CARRY, CARRY, WORK, MOVE, MOVE, MOVE],
            dedication: dedication,
            specifiedName: specifiedName,
            precious: precious,
            home: this.spawn.room.name,
            orders: orders
        };
    }

    private createDedicatedDropper(dedication: string, specifiedName: string, precious?: string): DedicatedCreepRequest {
        return {
            role: CreepRole.dropper,
            body: [WORK, WORK, WORK, WORK, WORK, WORK, MOVE],
            dedication: dedication,
            specifiedName: specifiedName,
            precious: precious
        };
    }

    private createDedicatedHauler(dedication: string, specifiedName: string): DedicatedCreepRequest {
        return {
            role: CreepRole.hauler,
            body: [CARRY, CARRY, MOVE],
            dedication: dedication,
            specifiedName: specifiedName
        };
    }


}
