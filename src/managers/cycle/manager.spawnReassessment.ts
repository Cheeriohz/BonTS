import { LinkManager } from "managers/structures/manager.links";

export class SpawnReassment {
    private spawn: StructureSpawn;

    constructor(spawn: StructureSpawn) {
        this.spawn = spawn;
    }

    public reassess() {
        this.reassessRCLNeeds();
        this.reassessLinkIds();
        this.spawn.memory.reassess = false;
    }

    private reassessRCLNeeds() {
        if (!this.spawn.memory.rcl) {
            this.spawn.memory.rcl = 0;
        }
        if (this.spawn.room.controller) {
            if (this.spawn.memory.rcl !== this.spawn.room.controller.level) {
                this.spawn.memory.rcl = this.spawn.room.controller.level;
                if (!this.spawn.memory.rclUpgrades) {
                    this.spawn.memory.rclUpgrades = [];
                }
                this.spawn.memory.rclUpgrades.push({ newRclLevel: this.spawn.memory.rcl });
            }
        }
    }

    private reassessLinkIds() {
        const linkManager: LinkManager = new LinkManager();
        linkManager.populateLinkMemory(this.spawn);
    }
}
