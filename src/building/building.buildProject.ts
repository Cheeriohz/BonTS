import { ConstructionSiteCacher } from "caching/manager.constructionSiteCacher";
import { CreepRequester } from "spawning/manager.creepRequester";
import { BuildProjectEnum } from "./interfaces/building.enum";
import _ from "lodash";
import { CreepRole } from "enums/enum.roles";
import { DedicatedCreepRequester } from "spawning/manager.dedicatedCreepRequester";
import { BuildProjectHandoff } from "./building.buildProjectHandoff";

export class BuildProjectManager {
    private spawn!: StructureSpawn;
    private project!: BuildProject;

    constructor(spawn: StructureSpawn, project: BuildProject) {
        this.spawn = spawn;
        this.project = project;
    }

    public manageProject() {
        if (this.project.roomName === this.spawn.room.name) {
            this.manageLocalProject();
        } else {
            this.manageRemoteProject();
        }
    }

    private manageLocalProject() {
        this.checkConstructionSites(this.spawn.room);
        this.addConstructionSites(this.spawn.room);
        this.maintainActiveLocalBuilder();
        if (this.project.activeSites === 0 && this.project.buildOrders.length === 0) {
            BuildProjectHandoff.handOffProject(false, this.project, this.spawn);
        }
        switch (this.project.projectType) {
            case BuildProjectEnum.LocalContainerExpansion: {
                if (this.spawn.room.memory.containerMap && this.spawn.room.memory.containerMap.length > 0) {
                    for (const containerMapping of this.spawn.room.memory.containerMap) {
                        const container: StructureContainer | null = Game.getObjectById(containerMapping.id!);
                        if (container) {
                            _.remove(this.spawn.room.memory.dropMap!, dm => {
                                return dm.x === container.pos.x && dm.y === container.pos.y;
                            });
                        }
                    }
                }
                break;
            }
        }
    }

    private manageRemoteProject() {
        const room = this.roomCheck(this.project.roomName);
        if (room) {
            this.checkConstructionSites(room);
            this.addConstructionSites(room);
        }
        this.maintainActiveRemoteBuilder();
        if (this.project.activeSites === 0 && this.project.buildOrders.length === 0) {
            BuildProjectHandoff.handOffProject(true, this.project, this.spawn);
        }
    }

    private roomCheck(roomName: string): Room | null {
        const room = Game.rooms[roomName];
        if (room) {
            return room;
        } else {
            const cr: CreepRequester = new CreepRequester(this.spawn);
            cr.RequestScoutToRoom(roomName);
            return null;
        }
    }

    private checkConstructionSites(room: Room) {
        ConstructionSiteCacher.updateConstructionSites(room);
        if (room.memory.constructionSites) {
            if (room.memory.constructionSites.length < this.project.activeSites) {
                this.project.activeSites = room.memory.constructionSites.length;
            }
        }
    }

    private addConstructionSites(room: Room) {
        while (this.project.buildOrders.length > 0 && this.project.activeSites < 3) {
            const buildSite: BuildOrder | undefined = this.project.buildOrders.pop();
            if (buildSite) {
                room.createConstructionSite(buildSite.x, buildSite.y, buildSite.type);
                this.project.activeSites++;
            }
        }
    }

    private maintainActiveLocalBuilder() {
        const creepRequester: CreepRequester = new CreepRequester(this.spawn);
        creepRequester.MaintainBuilder();
    }

    private maintainActiveRemoteBuilder() {
        if (!BuildProjectHandoff.getActiveRemoteBuilder(this.project.roomName)) {
            if (!this.creepInQueue(CreepRole.builder)) {
                const dcr: DedicatedCreepRequester = new DedicatedCreepRequester(this.spawn);
                dcr.createdDedicatedCreepRequest({
                    dedication: this.project.roomName,
                    role: CreepRole.builder,
                    specifiedName: `${this.spawn.name}_BPR_${this.project.roomName}`,
                    precious: undefined,
                    isRemote: true,
                    body: this.spawn.room.memory.templates![CreepRole.builder]
                });
            }
        }
    }

    private creepInQueue(role: CreepRole) {
        return _.find(this.spawn.memory.dedicatedCreepRequest, dc => {
            return dc.dedication === this.project.roomName && dc.role === role;
        });
    }
}
