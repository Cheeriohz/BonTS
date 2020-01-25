export class Visualizer {

    private roadStyle: LineStyle = {
        width: .5,
        color: "#FAAC58",
        opacity: 0.5,
        lineStyle: "dashed"
    };



    public visualizeRoadCrossRooms(startRoom: string, startPoint: RoomPosition, endRoom: string, endPoint: RoomPosition) {
        // RoomVisual.
        throw "Not Implemented";
    }

    public visualizeRoadInRoom(roomName: string, startPoint: RoomPosition, endPoint: RoomPosition) {
        const visualizer: RoomVisual = new RoomVisual(roomName);
        if (visualizer) {
            visualizer.line(startPoint, endPoint, this.roadStyle)
        }
    }
}
