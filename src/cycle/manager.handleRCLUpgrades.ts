import { ContainerExpansion } from "building/building.containerExpansion";
import { TerminalExpansion } from "building/building.terminalExpansion";
import _ from "lodash";
import { LabAddition } from "building/building.labAddtition";
import { RemoteHarvestHandler } from "remote/remote.remoteHarvestHandler";
import { ExtensionAddition } from "building/building.extensionAddition";
import { SpawnTemplate } from "spawning/spawning.templating";

export class RCLUpgradeHandler {
    public static handleRCLUpgrades(spawn: StructureSpawn) {
        // TODO This requires us moving our RCLUpgrade to be room level or global rather than just spawn level... eventually
        if (spawn.room.memory?.rclUpgrades) {
            const rclUpgradeEvent: RCLUpgradeEvent = spawn.room.memory.rclUpgrades[0];
            if (rclUpgradeEvent) {
                switch (rclUpgradeEvent.newRclLevel) {
                    case 2: {
                        if (this.handleRCLUpgradeTo2(spawn)) {
                            _.remove(spawn.room.memory.rclUpgrades, rclUpgradeEvent);
                        }
                        break;
                    }
                    case 6: {
                        if (this.handleRCLUpgradeTo6(spawn)) {
                            _.remove(spawn.room.memory.rclUpgrades, rclUpgradeEvent);
                        }
                        break;
                    }
                    case 7: {
                        if (this.handleRCLUpgradeTo7(spawn)) {
                            _.remove(spawn.room.memory.rclUpgrades, rclUpgradeEvent);
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

    private static handleRCLUpgradeTo2(spawn: StructureSpawn): boolean {
        const containerExpansion: ContainerExpansion = new ContainerExpansion(spawn, spawn.room, spawn.pos, false);
        containerExpansion.routeToSources();
        containerExpansion.routeToController();
        return true;
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
        if (!this.handleRoomExtensionsEnqueue([spawn], true, 50)) {
            return false;
        }
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

    private static handleRoomExtensionsEnqueue(
        spawns: StructureSpawn[],
        buildRoads: boolean,
        extensionCap: number
    ): boolean {
        const ea: ExtensionAddition = new ExtensionAddition(spawns, buildRoads);
        const returnCode = ea.alreadyProcessedSuccessfully(extensionCap);
        switch (returnCode) {
            case 0: {
                return ea.enqueueExtensionsProject();
            }
            case 1: {
                return true;
            }
            case 2: {
                return false;
            }
            default: {
                console.log("Unexpected return code in handleRoomExtensionsEnqueue");
                return false;
            }
        }
    }
}
