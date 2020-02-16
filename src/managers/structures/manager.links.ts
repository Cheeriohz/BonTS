import _ from "lodash";
import { CreepRole } from "enums/enum.roles";

export class LinkManager {
    // TODO Should treat storage as a source link... maybe

    public populateLinkMemory(spawn: StructureSpawn) {
        // First check to see if we have any sourceLinks
        const sources = spawn.room.find(FIND_SOURCES);
        if (sources.length > 0) {
            const allLinks: StructureLink[] = spawn.room.find<StructureLink>(FIND_STRUCTURES, {
                filter: structure => {
                    return structure.structureType === STRUCTURE_LINK;
                }
            });
            if (allLinks.length >= 2) {
                if (this.findSourceLinks(spawn.room, sources, allLinks)) {
                    this.findDumpLinks(spawn.room, allLinks);
                }
            }
        }
    }

    private findSourceLinks(spawnRoom: Room, sources: Source[], allLinks: StructureLink[]): boolean {
        let sourceLinks = _.flatten(
            _.compact(_.map(sources, source => source.pos.findInRange<StructureLink>(allLinks, 3)))
        );
        if (sourceLinks.length > 0) {
            spawnRoom.memory.sourceLinks = _.map(sourceLinks, sourcelink => _.get(sourcelink, "id"));
            return true;
        }
        return false;
    }

    private findDumpLinks(spawnRoom: Room, allLinks: StructureLink[]) {
        if (spawnRoom.memory.sourceLinks) {
            spawnRoom.memory.dumpLinks = _.compact(
                _.difference(
                    _.map(allLinks, allLinks => _.get(allLinks, "id")),
                    spawnRoom.memory.sourceLinks
                )
            );
            spawnRoom.memory.templates![CreepRole.dropper] = [WORK, WORK, WORK, WORK, WORK, CARRY];
            spawnRoom.memory.linksActive = true;
        }
    }

    public balanceEnergyForSpawn(spawn: StructureSpawn) {
        if (spawn && spawn.room.memory.dumpLinks && spawn.room.memory.sourceLinks) {
            if (spawn.room.memory.dumpLinks.length > 0 && spawn.room.memory.sourceLinks.length > 0) {
                this.balanceEnergy(spawn.room.memory.sourceLinks, spawn.room.memory.dumpLinks);
            }
        }
    }

    private balanceEnergy(sourceLinkIds: Id<StructureLink>[], dumpLinkIds: Id<StructureLink>[]) {
        const sourceLinks: StructureLink[] = _.compact(
            _.map(sourceLinkIds, id => Game.getObjectById<StructureLink>(id))
        );
        const dumpLinks: StructureLink[] = _.compact(_.map(dumpLinkIds, id => Game.getObjectById<StructureLink>(id)));
        if (this.linkEnergyAvailable(sourceLinks)) {
            if (this.linkEnergyNeeded(dumpLinks)) {
                this.transmitEnergy(sourceLinks, dumpLinks);
            }
        }
    }
    private transmitEnergy(sourceLinks: StructureLink[], dumpLinks: StructureLink[]) {
        for (const sourceLink of sourceLinks) {
            for (const dumpLink of dumpLinks) {
                sourceLink.transferEnergy(dumpLink);
            }
        }
    }

    private linkEnergyAvailable(links: StructureLink[]): boolean {
        return _.filter(links, link => link.store.energy > 100).length > 0;
    }

    private linkEnergyNeeded(links: StructureLink[]): boolean {
        return _.filter(links, link => link.store.energy < 800).length > 0;
    }
}
