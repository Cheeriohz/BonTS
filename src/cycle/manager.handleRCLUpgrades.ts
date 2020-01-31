import { ContainerExpansion } from "building/building.containerExpansion";
import { TerminalExpansion } from "building/building.terminalExpansion";
import _ from "lodash";

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

        const terminalExpansion: TerminalExpansion = new TerminalExpansion(spawn);
        if (terminalExpansion.enqueueTerminalProject()) {
            return true;
        } else {
            return false;
        }
    }
}
