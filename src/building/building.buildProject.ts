import { ConstructionSiteCacher } from "caching/manager.constructionSiteCacher";
import { CreepRequester } from "cycle/manager.creepRequester";
import { BuildProjectEnum } from "./interfaces/building.enum";
import _ from "lodash";
import { buildEmptyContainerMap } from "caching/manager.containerSelector";
import { CreepRole } from "enums/enum.roles";
import { DedicatedCreepRequester } from "cycle/manager.dedicatedCreepRequester";

export class BuildProjectManager {
    private spawn!: StructureSpawn;
    private project!: BuildProject;

    constructor(spawn: StructureSpawn, project: BuildProject) {
        this.spawn = spawn;
        this.project = project;
    }

    public manageProject() {
        if (this.project.roomName === this.spawn.room.name) {
            this.manageProject();
        }
        else {
            this.manageRemoteProject();
        }

    }

    private manageLocalProject() {
        this.checkConstructionSites(this.spawn.room);
        this.addConstructionSites(this.spawn.room);
        this.maintainActiveLocalBuilder();
        if (this.project.activeSites === 0 && this.project.buildOrders.length === 0) {
            this.handOffProject(false);
        }
    }

    private manageRemoteProject() {
        // NOT IMPLEMENTED YET
        return;
    }

    private _manageRemoteProject() {
        const room = this.roomCheck(this.project.roomName);
        if (room) {
            this.checkConstructionSites(room);
            this.addConstructionSites(room);
        }
        this.maintainActiveRemoteBuilder();
        if (this.project.activeSites === 0 && this.project.buildOrders.length === 0) {
            this.handOffProject(true);
        }
    }

    private roomCheck(roomName: string): Room | null {
        const room = Game.rooms[roomName];
        if (room) {
            return room;
        }
        else {
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
        if (!this.getActiveRemoteBuilder(this.project.roomName)) {
            const dcr: DedicatedCreepRequester = new DedicatedCreepRequester(this.spawn);
            dcr.createdDedicatedCreepRequest(this.project.roomName, CreepRole.builder, `${this.spawn.name}_BPR_${this.project.roomName}`);
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


    private handOffProject(remote: boolean) {
        switch (this.project.projectType) {
            case BuildProjectEnum.LocalMineralExpansion: {
                this.handOffLocalMineralExpansion();
            }
            case BuildProjectEnum.LocalContainerExpansion: {
                this.handOffLocalContainerExpansion();
            }
            case BuildProjectEnum.RemoteContainerExpansion: {
                this.attemptRemoteContainerExpansionHandOff(remote);
            }
        }
    }

    private attemptRemoteContainerExpansionHandOff(remote: boolean) {
        if (this.spawn.memory.buildProjects!.length > 1) {
            // There are more build Projects for this remote expansion, remove the current project and allow it to continue.
            _.remove(this.spawn.memory.buildProjects!, this.project);
            if (remote) {
                // If we are already in the remote phase, reassign the remote builder.
                const remoteBot = this.getActiveRemoteBuilder(this.project.roomName);
                if (remoteBot) {
                    remoteBot.memory.dedication = this.spawn.memory.buildProjects![0].roomName;
                }
            }
            // kickoff the next build project immediately.
            this.kickOffNextProject();
        }
        else {
            // TODO Implement final build project hand off for remote expansion.
        }
    }

    private kickOffNextProject() {
        const projectManager: BuildProjectManager = new BuildProjectManager(this.spawn, this.spawn.memory.buildProjects![0]);
        projectManager.manageProject();
    }

    private handOffLocalContainerExpansion() {
        if (this.spawn.room.memory.containerMap) {
            // empty the map, so it will reassess.
            this.spawn.room.memory.containerMap = null;
        }
        buildEmptyContainerMap([], this.spawn.room)
        this.clearHaulerContainerSelection(this.spawn.room);
        _.remove(this.spawn.memory.buildProjects!, this.project);
    }

    private clearHaulerContainerSelection(room: Room) {
        for (const creep of _.filter(_.values(Game.creeps), (c) => { return c.room.name === room.name && c.memory.role === CreepRole.hauler && !c.memory.dedication; })) {
            creep.memory.precious = null;
        }
    }

    private handOffLocalMineralExpansion() {
        const extractors: StructureExtractor[] = this.spawn.room.find<StructureExtractor>(FIND_STRUCTURES, {
            filter: (s) => { return s.structureType === STRUCTURE_EXTRACTOR; }
        });
        if (extractors.length > 0) {
            const container: StructureContainer | null = extractors[0].pos.findClosestByRange<StructureContainer>(FIND_STRUCTURES, {
                filter: (s) => { return s.structureType === STRUCTURE_CONTAINER; }
            });
            if (container) {
                const minerals: Mineral[] = extractors[0].pos.lookFor(LOOK_MINERALS);
                if (minerals.length > 0) {
                    this.spawn.room.memory.mine = {
                        extractorId: extractors[0].id,
                        containerId: container.id,
                        miner: "",
                        hauler: "",
                        type: minerals[0].mineralType,
                        vein: minerals[0].id
                    }
                }
                this.spawn.room.createConstructionSite(container.pos.x, container.pos.y, STRUCTURE_ROAD);
                _.remove(this.spawn.memory.buildProjects!, this.project);
            }
        }
    }
}
