import { profile } from "Profiler";
import { RoleCreep } from "../base/role.creep";
import { GeneralBuilding } from "building/base/building.general";

@profile
export class RoleDedicatedTopper extends RoleCreep {
    static tickAmount: number = 100;

    public run(creep: Creep) {
        this.carryOutDedicatedWork(creep);
    }

    protected carryOutDedicatedWork(creep: Creep) {
        if (creep.memory.working) {
            if (!this.handlingTransitRequests(creep)) {
                //this.handleGeneralBalancing(creep);
                // TODO finish
            }
        } else {
            // energy full, time to find deposit location.
            this.dropperPosition(creep);
        }
    }

    private handlingTransitRequests(creep: Creep): boolean {
        if (!creep.room.memory.transit) {
            creep.room.memory.transit = { activeRequest: null, receiving: false };
        }

        if (creep.room.memory.transit.activeRequest) {
            return this.handlingActiveTransitRequest(
                creep,
                creep.room.memory.transit.activeRequest,
                creep.room.memory.transit.receiving
            );
        } else {
            //return this.checkingForTransitRequest(creep);
            return false;
            // TODO finish
        }
    }

    private handlingActiveTransitRequest(creep: Creep, request: TransitRequest, receiving: boolean): boolean {
        const storage = creep.room.storage;
        const terminal = creep.room.terminal;

        // First check if we have completed our prerequisites for this request.
        if (receiving) {
            if (terminal && terminal.store.getFreeCapacity(request.commodity) >= request.amount) {
                // We have enough incoming room to clear the transit,
                // but we force the sender to clear the active request.
                // Check for ancilliary work.
                //return this.handleGeneralBalancing(creep);
                return false;
                // TODO finish
            } else {
                this.transitFlow(creep, terminal!, storage!, RESOURCE_ENERGY);
                return true;
            }
        }

        return false;
    }

    private transitFlow(
        creep: Creep,
        from: StructureTerminal | StructureStorage,
        to: StructureTerminal | StructureStorage,
        type: ResourceConstant
    ) {
        if (to.store.getFreeCapacity(type) > creep.getActiveBodyparts(CARRY) * 50) {
            creep.transfer(to, type);
            creep.withdraw(from, type);
        }
    }

    private dropperPosition(creep: Creep) {
        const storage = creep.room.storage;
        const terminal = creep.room.terminal;
        if (storage && terminal) {
            if (creep.pos.getRangeTo(storage) === 1 && creep.pos.getRangeTo(terminal) === 1) {
                creep.memory.working = true;
            } else {
                const terminalDirection = storage.pos.getDirectionTo(terminal);
                const cwPOS = GeneralBuilding.getRoomPositionForDirection(
                    storage.pos,
                    GeneralBuilding.directionClockwise(terminalDirection)
                );
                if (!GeneralBuilding.existingDisqualifyingStructureRP(cwPOS)) {
                    this.cachedTravel(cwPOS, creep, false, false);
                    return;
                }
                const ccPos = GeneralBuilding.getRoomPositionForDirection(
                    storage.pos,
                    GeneralBuilding.directionCounterClockwise(terminalDirection)
                );
                if (!GeneralBuilding.existingDisqualifyingStructureRP(ccPos)) {
                    this.cachedTravel(ccPos, creep, false, false);
                    return;
                }
                const storageDirection = terminal.pos.getDirectionTo(storage);
                const tcwPOS = GeneralBuilding.getRoomPositionForDirection(
                    terminal.pos,
                    GeneralBuilding.directionClockwise(storageDirection)
                );
                if (!GeneralBuilding.existingDisqualifyingStructureRP(tcwPOS)) {
                    this.cachedTravel(tcwPOS, creep, false, false);
                    return;
                }
                const tccPos = GeneralBuilding.getRoomPositionForDirection(
                    terminal.pos,
                    GeneralBuilding.directionCounterClockwise(storageDirection)
                );
                if (!GeneralBuilding.existingDisqualifyingStructureRP(tccPos)) {
                    this.cachedTravel(tccPos, creep, false, false);
                    return;
                }
                console.log("Poor Topper can't find a spot to set up shop");
            }
        }
    }
}
