import { CreepRole } from "enums/enum.roles";

// This requester is for dedicated tasks. Maintaining and regulating requests is to be done externally to the class.
export class DedicatedCreepRequester {
    private spawn!: StructureSpawn;

    constructor(spawn: StructureSpawn) {
        this.spawn = spawn;
    }

    public createdDedicatedCreepRequest({
        dedication,
        role,
        specifiedName,
        precious,
        isRemote,
        orders,
        reserved
    }: {
        dedication: string;
        role: CreepRole;
        specifiedName: string;
        precious?: string;
        isRemote?: boolean;
        orders?: CreepOrder;
        reserved?: boolean;
    }) {
        if (!this.spawn.memory.dedicatedCreepRequest) {
            this.spawn.memory.dedicatedCreepRequest = [];
        }
        switch (role) {
            case CreepRole.harvester: {
                if (isRemote) {
                    this.spawn.memory.dedicatedCreepRequest.push(
                        this.createDedicatedRemoteHarvester(dedication, specifiedName, precious, orders)
                    );
                    break;
                }
                break;
            }
            case CreepRole.builder: {
                if (isRemote) {
                    this.spawn.memory.dedicatedCreepRequest.push(
                        this.createDedicatedRemoteBuilder(dedication, specifiedName)
                    );
                    break;
                }
                break;
            }
            case CreepRole.dropper: {
                if (isRemote) {
                    if (reserved) {
                        this.spawn.memory.dedicatedCreepRequest.push(
                            this.createDedicatedReservedRemoteDropper(dedication, specifiedName, precious, orders)
                        );
                    } else {
                        this.spawn.memory.dedicatedCreepRequest.push(
                            this.createDedicatedRemoteDropper(dedication, specifiedName, precious, orders)
                        );
                    }
                    break;
                } else {
                    this.spawn.memory.dedicatedCreepRequest.push(
                        this.createDedicatedDropper(dedication, specifiedName, precious)
                    );
                }
                break;
            }
            case CreepRole.hauler: {
                if (isRemote) {
                    this.spawn.memory.dedicatedCreepRequest.push(
                        this.createDedicatedRemoteHauler(dedication, specifiedName, precious, orders)
                    );
                    break;
                }
                this.spawn.memory.dedicatedCreepRequest.push(this.createDedicatedHauler(dedication, specifiedName));
                break;
            }
            case CreepRole.reserver: {
                if (isRemote) {
                    this.spawn.memory.dedicatedCreepRequest.push(
                        this.createDedicatedRemoteReserver(dedication, specifiedName)
                    );
                    break;
                }
                break;
            }
            case CreepRole.knight: {
                if (isRemote) {
                    this.spawn.memory.dedicatedCreepRequest.push(
                        this.createDedicatedRemoteKnight(dedication, specifiedName, precious, orders)
                    );
                    break;
                }
                this.spawn.memory.dedicatedCreepRequest.push(
                    this.createDedicatedKnight(dedication, specifiedName, precious, orders)
                );
                break;
            }
            case CreepRole.archer: {
                if (isRemote) {
                    this.spawn.memory.dedicatedCreepRequest.push(
                        this.createDedicatedRemoteArcher(dedication, specifiedName, precious, orders)
                    );
                    break;
                }
                break;
            }
            default: {
                console.log(`Cannot created dedicated creep of role: ${CreepRole[role]}`);
            }
        }
    }

    private createDedicatedRemoteHarvester(
        dedication: string,
        specifiedName: string,
        precious?: string,
        orders?: CreepOrder
    ): DedicatedCreepRequest {
        return {
            role: CreepRole.harvester,
            body: [WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE],
            dedication: dedication,
            specifiedName: specifiedName,
            precious: precious,
            home: this.spawn.room.name,
            orders: orders
        };
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

    private createDedicatedRemoteDropper(
        dedication: string,
        specifiedName: string,
        precious?: string,
        orders?: CreepOrder
    ): DedicatedCreepRequest {
        return {
            role: CreepRole.dropper,
            body: [WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE],
            dedication: dedication,
            specifiedName: specifiedName,
            precious: precious,
            home: this.spawn.room.name,
            orders: orders
        };
    }

    private createDedicatedRemoteKnight(
        dedication: string,
        specifiedName: string,
        precious?: string,
        orders?: CreepOrder
    ): DedicatedCreepRequest {
        return {
            role: CreepRole.knight,
            body: [
                TOUGH,
                TOUGH,
                TOUGH,
                TOUGH,
                ATTACK,
                ATTACK,
                ATTACK,
                ATTACK,
                MOVE,
                MOVE,
                MOVE,
                MOVE,
                MOVE,
                MOVE,
                MOVE,
                MOVE,
                MOVE,
                MOVE,
                HEAL,
                HEAL
            ],
            dedication: dedication,
            specifiedName: specifiedName,
            precious: precious,
            home: this.spawn.room.name,
            orders: orders
        };
    }

    private createDedicatedKnight(
        dedication: string,
        specifiedName: string,
        precious?: string,
        orders?: CreepOrder
    ): DedicatedCreepRequest {
        return {
            role: CreepRole.knight,
            body: [
                TOUGH,
                TOUGH,
                TOUGH,
                TOUGH,
                ATTACK,
                ATTACK,
                ATTACK,
                ATTACK,
                MOVE,
                MOVE,
                MOVE,
                MOVE,
                MOVE,
                MOVE,
                MOVE,
                MOVE,
                MOVE,
                MOVE,
                HEAL,
                HEAL
            ],
            dedication: dedication,
            specifiedName: specifiedName,
            precious: precious,
            home: null,
            orders: orders
        };
    }

    private createDedicatedRemoteArcher(
        dedication: string,
        specifiedName: string,
        precious?: string,
        orders?: CreepOrder
    ): DedicatedCreepRequest {
        return {
            role: CreepRole.archer,
            body: [MOVE, MOVE, MOVE, MOVE, MOVE, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, HEAL],
            dedication: dedication,
            specifiedName: specifiedName,
            precious: precious,
            home: this.spawn.room.name,
            orders: orders
        };
    }

    private createDedicatedReservedRemoteDropper(
        dedication: string,
        specifiedName: string,
        precious?: string,
        orders?: CreepOrder
    ): DedicatedCreepRequest {
        return {
            role: CreepRole.dropper,
            body: [WORK, WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE],
            dedication: dedication,
            specifiedName: specifiedName,
            precious: precious,
            home: this.spawn.room.name,
            orders: orders
        };
    }

    private createDedicatedRemoteHauler(
        dedication: string,
        specifiedName: string,
        precious?: string,
        orders?: CreepOrder
    ): DedicatedCreepRequest {
        return {
            role: CreepRole.hauler,
            body: [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, WORK, MOVE, MOVE, MOVE, MOVE],
            dedication: dedication,
            specifiedName: specifiedName,
            precious: precious,
            home: this.spawn.room.name,
            orders: orders
        };
    }

    private createDedicatedRemoteReserver(dedication: string, specifiedName: string): DedicatedCreepRequest {
        return {
            role: CreepRole.reserver,
            body: [MOVE, CLAIM, CLAIM],
            dedication: dedication,
            specifiedName: specifiedName,
            precious: null,
            home: this.spawn.room.name,
            orders: undefined
        };
    }

    private createDedicatedDropper(
        dedication: string,
        specifiedName: string,
        precious?: string
    ): DedicatedCreepRequest {
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
