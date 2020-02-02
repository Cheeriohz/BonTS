import { ContainerExpansion } from "building/building.containerExpansion";
import { TerminalExpansion } from "building/building.terminalExpansion";
import _ from "lodash";
import { LabAddition } from "building/building.labAddtition";
import { RemoteHarvestHandler } from "remote/remote.remoteHarvestHandler";

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
                    case 7: {
                        if (this.handleRCLUpgradeTo7(spawn)) {
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
        const le: LabAddition = new LabAddition(spawn);
        if (!le.alreadyProcessedSuccessfully(6)) {
            if (!le.enqueueLabProject(3)) {
                return false;
            }
        }
        return true;
    }

    private static handleRCLUpgradeTo7(spawn: StructureSpawn): boolean {
        /*
		const sa: SpawnAddition = new SpawnAddition(spawn);
		if(!sa.enqueSpawnProject()) {
			return false;
		}

		const ta: TowerAddition = new TowerAddition(spawn);
		if(!ta.enqueueTowerProject()){
			return false;
		}
		*/

        const le: LabAddition = new LabAddition(spawn);
        if (!le.alreadyProcessedSuccessfully(7)) {
            if (!le.enqueueLabProject(3)) {
                return false;
            }
        }

        /*
		const fa: FactoryAddition = new FactoryAddition(spawn);
		if(!fa.enqueueFactoryProject()) {
			return false;
		}
		*/
        return true;
    }
}
