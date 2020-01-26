export class Visualizer {

    private lineStyle: LineStyle = {
        width: .5,
        color: "#FAAC58",
        opacity: 0.5,
        lineStyle: "dashed"
    };

    private circleStyle: CircleStyle = {
        radius: .2,
        stroke: "#FAAC58",
        strokeWidth: .05,
        fill: "#767A80"
    };




    public visualizeRoadCrossRooms(startRoom: string, startPoint: RoomPosition, endRoom: string, endPoint: RoomPosition) {
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
            visualizer.line(startPoint, endPoint, this.lineStyle)
        }
    }
}
