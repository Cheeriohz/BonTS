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
        if (!this.spawn.room.memory.rcl) {
            this.spawn.room.memory.rcl = 0;
        }
        if (this.spawn.room.controller) {
            if (this.spawn.room.memory.rcl !== this.spawn.room.controller.level) {
                this.spawn.room.memory.rcl = this.spawn.room.controller.level;
                if (!this.spawn.room.memory.rclUpgrades) {
                    this.spawn.room.memory.rclUpgrades = [];
                }
                delete this.spawn.room.memory.structureDistanceTransform;
                delete this.spawn.room.memory.roadAgnosticDistanceTransform;
                delete this.spawn.room.memory.extensionAgnosticDistanceTransform;
                this.spawn.room.memory.rclUpgrades.push({ newRclLevel: this.spawn.room.memory.rcl });
            }
        }
    }

    private reassessLinkIds() {
        const linkManager: LinkManager = new LinkManager();
        linkManager.populateLinkMemory(this.spawn);
    }
}
