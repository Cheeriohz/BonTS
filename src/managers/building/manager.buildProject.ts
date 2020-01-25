import { ConstructionSiteCacher } from "managers/caching/manager.constructionSiteCacher";
import { CreepRequester } from "managers/cycle/manager.creepRequester";
import { BuildProjectEnum } from "./interfaces/building.enum";
import _ from "lodash";

export class BuildProjectManager {
    private spawn!: StructureSpawn;
    private project!: BuildProject;

    constructor(spawn: StructureSpawn, project: BuildProject) {
        this.spawn = spawn;
        this.project = project;
    }

    public manageProject() {
        this.checkConstructionSites();
        this.addConstructionSites();
        this.maintainActiveBuilder();
        if (this.project.activeSites === 0 && this.project.buildOrders.length === 0) {
            this.handOffProject();
        }
    }

    private checkConstructionSites() {
        ConstructionSiteCacher.updateConstructionSites(this.spawn.room);
        if (this.spawn.room.memory.constructionSites) {
            if (this.spawn.room.memory.constructionSites.length < this.project.activeSites) {
                this.project.activeSites = this.spawn.room.memory.constructionSites.length;
            }
        }
    }

    private addConstructionSites() {
        while (this.project.buildOrders.length > 0 && this.project.activeSites < 3) {
            const buildSite: BuildOrder | undefined = this.project.buildOrders.pop();
            if (buildSite) {
                this.spawn.room.createConstructionSite(buildSite.x, buildSite.y, buildSite.type);
                this.project.activeSites++;
            }
        }
    }

    private maintainActiveBuilder() {
        const creepRequester: CreepRequester = new CreepRequester(this.spawn);
        creepRequester.MaintainBuilder();
    }

    private handOffProject() {
        switch (this.project.projectType) {
            case BuildProjectEnum.LocalMineralExpansion:
                this.handOffLocalMineralExpansion();
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
                if (this.spawn.memory.buildProjects) {
                    _.remove(this.spawn.memory.buildProjects, this.project);
                }
            }
        }
    }
}
