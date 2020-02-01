import { ContainerExpansion } from "building/building.containerExpansion";
import { TerminalExpansion } from "building/building.terminalExpansion";
import _ from "lodash";
import { LabExpansion } from "building/building.labExpansion";

export class RCLUpgradeHandler {
    public static handleRCLUpgrades(spawn: StructureSpawn) {
        if (spawn.memory?.rclUpgrades) {
            const rclUpgradeEvent: RCLUpgradeEvent = spawn.memory.rclUpgrades[0];
            if (rclUpgradeEvent) {
                switch (rclUpgradeEvent.newRclLevel) {
                    case 6: {
                        if (this.handleRCLUpgradeTo6(spawn)) {
                            _.remove(spawn.memory.rclUpgrades, rclUpgradeEvent);
                        }
                        break;
                    }
                    default: {
                        console.log(`No handling implemented for RCL Level ${rclUpgradeEvent.newRclLevel}`);
                    }
                }
            }
        }
    }

    private static handleRCLUpgradeTo6(spawn: StructureSpawn): boolean {
        const containerExpansion: ContainerExpansion = new ContainerExpansion(spawn, spawn.room, spawn.pos, false);
        containerExpansion.checkForMineralExpansion();

        // Check if we need a terminal.
        if (
            !_.find(
                _.values(Game.structures),
                s => s.room.name === spawn.room.name && s.structureType === STRUCTURE_TERMINAL
            )
        ) {
            const terminalExpansion: TerminalExpansion = new TerminalExpansion(spawn);
            if (!terminalExpansion.enqueueTerminalProject()) {
                return false;
            }
        }
        const le: LabExpansion = new LabExpansion(Game.spawns["Sp1"]);
        if (!le.enqueueLabProject(3)) {
            return false;
        }
        return true;
    }
}
