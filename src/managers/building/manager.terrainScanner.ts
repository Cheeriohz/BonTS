export class TerrainScanner {
    public getTerrain(room: string): RoomTerrain {
        return Game.rooms[room]?.getTerrain();
    }

    public logTerrainData(room: string) {
        const rt: RoomTerrain = this.getTerrain(room);
        for (let y = 0; y < 50; y++) {
            let buffer: string = "";
            for (let x = 0; x < 50; x++) {
                buffer += rt.get(x, y);
            }
            console.log(buffer);
        }
    }
}
