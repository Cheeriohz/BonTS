import { GeneralBuilding } from "./base/building.general";
import { buildProjectCreator } from "./building.buildProjectCreator";

export class SpawnPlanting extends GeneralBuilding {
    private room!: Room;
    private spawn!: StructureSpawn;
    private roomScout!: RoomScout;
    private roughCenter?: RoomPosition;

    constructor(room: Room, spawn: StructureSpawn) {
        super();
        this.room = room;
        this.spawn = spawn;
        this.roomScout = Memory.scouting.roomScouts[this.room.name];
    }

    public plant(): boolean {
        if (this.roomScout) {
            let deserializedNaturalDistanceTransform: CostMatrix;
            if (!this.room.memory.naturalDistanceTransform) {
                deserializedNaturalDistanceTransform = this.distanceTransformRaw(this.room.name, false);
                this.room.memory.naturalDistanceTransform = deserializedNaturalDistanceTransform.serialize();
            } else {
                deserializedNaturalDistanceTransform = PathFinder.CostMatrix.deserialize(
                    this.room.memory.naturalDistanceTransform
                );
            }
            if (this.calculateRoughCenterPoint()) {
                const plantSpot = this.traverseDistanceTransformDeserialized(
                    this.roughCenter!,
                    deserializedNaturalDistanceTransform,
                    5
                );
                if (plantSpot) {
                    const bpc: buildProjectCreator = new buildProjectCreator(this.room!, this.spawn);
                    bpc.createSpawnBuildProject(plantSpot, this.roomScout);
                    return true;
                }
            }
        } else {
            console.log("Missing scouting for spawn plant");
        }
        return false;
    }

    private calculateRoughCenterPoint(): boolean {
        if (this.roomScout.sourceA && this.roomScout.sourceB) {
            const sourceA = Game.getObjectById(this.roomScout.sourceA!);
            const sourceB = Game.getObjectById(this.roomScout.sourceB!);
            const controller = this.room.controller;
            if (sourceA && sourceB && controller) {
                let xPos: number = sourceA.pos.x + sourceB.pos.x + controller.pos.x;
                xPos = Math.round(xPos / 3);
                let yPos: number = sourceA.pos.y + sourceB.pos.y + controller.pos.y;
                yPos = Math.round(yPos / 3);
                this.roughCenter = new RoomPosition(xPos, yPos, this.room.name);
                return true;
            } else {
                return false;
            }
        }
        return false;
    }
}
