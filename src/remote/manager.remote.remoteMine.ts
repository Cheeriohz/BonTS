import { CreepRole } from "enums/enum.roles";
import { DedicatedCreepRequester } from "../cycle/manager.dedicatedCreepRequester";
import _ from "lodash";

export class RemoteMineManager {
    room!: Room;
    spawn!: StructureSpawn;
    mine!: RemoteMine;

    constructor(room: Room, spawn: StructureSpawn, mine: RemoteMine) {
        this.room = room;
        this.spawn = spawn;
        this.mine = mine;
    }

    public manageMine(checkPersonnel: boolean) {
        if (checkPersonnel) {
            this.checkPersonnel();
        }
    }

    private checkPersonnel() {
        if (this.spawn.spawning) {
            return;
        }
        if (this.mine.miner) {
            if (this.minerPreSpawn()) {
                this.requestMiner();
            } else {
                const miner = Game.creeps[this.mine.miner];
                if (!miner) {
                    if (!this.creepInQueue(CreepRole.dropper)) {
                        this.requestMiner();
                    }
                }
            }
        } else {
            this.requestMiner();
        }
        if (this.mine.haulers) {
            this.removeUnusedHaulers();
            let haulerCap = 2;
            if (this.mine.reserved) {
                haulerCap = 4;
            }
            if (this.mine.haulers.length < haulerCap) {
                if (!this.creepInQueue(CreepRole.hauler)) {
                    if (this.haulerNeeded()) {
                        this.requestHauler();
                    }
                }
            }
        } else {
            this.mine.haulers = [];
            this.requestHauler();
        }
    }

    private minerPreSpawn(): boolean {
        return false;
    }

    private removeUnusedHaulers() {
        for (const hauler of this.mine.haulers!) {
            if (!Game.creeps[hauler]) {
                _.remove(this.mine.haulers!, h => {
                    return h === hauler;
                });
            }
        }
    }

    private haulerNeeded(): boolean {
        const room = Game.rooms[this.mine.roomName];
        if (room) {
            const container: StructureContainer | null = Game.getObjectById(this.mine.containerId!);
            if (container) {
                return true;
            } else {
                // Container has been destroyed, need to rebuild
                if (!this.reassignContainer()) {
                    this.rebuildContainer();
                }
            }
            return false;
        } else {
            return true;
        }
    }

    private reassignContainer(): boolean {
        const endPos = _.last(this.mine.pathingLookup[this.mine.roomName][0]);
        if (endPos) {
            const containerPos = new RoomPosition(endPos.x, endPos.y, this.mine.roomName);
            if (containerPos) {
                const container: Structure | undefined = containerPos
                    .lookFor(LOOK_STRUCTURES)
                    .find(object => object.structureType === STRUCTURE_CONTAINER);
                if (container) {
                    this.mine.containerId = <Id<StructureContainer>>container.id;
                    return true;
                }
            }
        }
        return false;
    }

    private rebuildContainer() {
        const endPos = _.last(this.mine.pathingLookup[this.mine.roomName][0]);
        if (endPos) {
            this.room.createConstructionSite(endPos.x, endPos.y, STRUCTURE_CONTAINER);
            this.maintainActiveRemoteBuilder(this.mine.roomName);
        }
    }

    // TODO -  This code is common to remote. Should make it available external to any one class.
    private maintainActiveRemoteBuilder(containerRoomName: string) {
        if (!this.getActiveRemoteBuilder(containerRoomName)) {
            const dcr: DedicatedCreepRequester = new DedicatedCreepRequester(this.spawn);
            dcr.createdDedicatedCreepRequest({
                dedication: containerRoomName,
                role: CreepRole.builder,
                specifiedName: `${this.spawn.name}_BPR_${containerRoomName}`,
                precious: undefined,
                isRemote: true
            });
        }
    }

    private getActiveRemoteBuilder(roomName: string): Creep | null {
        for (const creep of _.values(Game.creeps)) {
            if (creep.memory.role === CreepRole.builder) {
                if (creep.memory.dedication) {
                    if (creep.memory.dedication === roomName) {
                        return creep;
                    }
                }
            }
        }
        return null;
    }
    // END TODO

    private creepInQueue(role: CreepRole) {
        return _.find(this.spawn.memory.dedicatedCreepRequest, dc => {
            return dc.dedication === this.mine.containerId && dc.role === role;
        });
    }

    private requestMiner() {
        const minerName: string = `dMiner${this.room.name}${Game.time.toPrecision(8)}`;
        const dcr: DedicatedCreepRequester = new DedicatedCreepRequester(this.spawn);
        dcr.createdDedicatedCreepRequest({
            dedication: this.mine.containerId!,
            role: CreepRole.dropper,
            specifiedName: minerName,
            precious: this.mine.vein,
            isRemote: true,
            orders: {
                target: this.mine.roomName,
                independentOperator: false
            },
            reserved: this.mine.reserved
        });
        this.mine.miner = minerName;
    }

    private requestHauler() {
        const haulerName: string = `dHauler${this.room.name}${Game.time.toPrecision(8)}`;
        const dcr: DedicatedCreepRequester = new DedicatedCreepRequester(this.spawn);
        dcr.createdDedicatedCreepRequest({
            dedication: this.mine.containerId!,
            role: CreepRole.hauler,
            specifiedName: haulerName,
            precious: undefined,
            isRemote: true,
            orders: {
                target: this.mine.roomName,
                independentOperator: false
            }
        });
        if (this.mine.haulers!.length > 0) {
            this.mine.haulers?.push(haulerName);
        } else {
            this.mine.haulers = [haulerName];
        }
    }
}
