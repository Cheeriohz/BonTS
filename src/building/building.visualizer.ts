import _ from "lodash";

export class Visualizer {
    private lineStyle: LineStyle = {
        width: 0.5,
        color: "#FAAC58",
        opacity: 0.5,
        lineStyle: "dashed"
    };

    private circleStyle: CircleStyle = {
        radius: 0.2,
        stroke: "#FAAC58",
        strokeWidth: 0.05,
        fill: "#767A80"
    };

    public drawBuildOrders(buildOrders: BuildOrder[], roomName: string, opts = {}): void {
        _.defaults(opts, { opacity: 0.5 });
        let vis = new RoomVisual(roomName);
        for (const buildOrder of buildOrders) {
            vis.structure(buildOrder.x, buildOrder.y, buildOrder.type, opts);
        }
        vis.connectRoads(opts);
    }

    public visualizeRoadCrossRooms(
        startRoom: string,
        startPoint: RoomPosition,
        endRoom: string,
        endPoint: RoomPosition
    ) {
        // RoomVisual.
        throw "Not Implemented";
    }

    public visualizeRoadInRoom(roomName: string, path: PathStep[]) {
        const visualizer: RoomVisual = new RoomVisual(roomName);
        if (visualizer) {
            if (path) {
                if (path.length > 0) {
                    for (const pathStep of path) {
                        visualizer.circle(pathStep.x, pathStep.y, this.circleStyle);
                    }
                }
            }
        }
    }

    public visualizeTargetCallout(roomName: string, startPoint: RoomPosition, endPoint: RoomPosition) {
        const visualizer: RoomVisual = new RoomVisual(roomName);
        if (visualizer) {
            visualizer.line(startPoint, endPoint, this.lineStyle);
        }
    }
}
