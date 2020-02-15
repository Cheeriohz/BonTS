import _ from "lodash";
import { Visualizer } from "../building.visualizer";

export class GeneralBuilding {
    protected cardinalDirections = [TOP, RIGHT, BOTTOM, LEFT];
    protected cardinals: Array<[number, number]> = [
        [0, -1],
        [1, 0],
        [0, 1],
        [-1, 0]
    ];

    protected calculateOrthogonalDistance(a: RoomPosition, b: RoomPosition): number {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    protected createExtensionBuildOrder(x: number, y: number): BuildOrder {
        return { x: x, y: y, type: STRUCTURE_EXTENSION };
    }

    protected createRoadBuildOrder(x: number, y: number): BuildOrder {
        return { x: x, y: y, type: STRUCTURE_ROAD };
    }

    // The x,y should be the top of the diamond
    protected buildRoadDiamond(x: number, y: number): BuildOrder[] {
        return [
            this.createRoadBuildOrder(x, y),
            this.createRoadBuildOrder(x + 1, y + 1),
            this.createRoadBuildOrder(x + 2, y + 2),
            this.createRoadBuildOrder(x + 1, y + 3),
            this.createRoadBuildOrder(x, y + 4),
            this.createRoadBuildOrder(x - 1, y + 3),
            this.createRoadBuildOrder(x - 2, y + 2),
            this.createRoadBuildOrder(x - 1, y + 1)
        ];
    }

    protected getDirectionConstant(dx: number, dy: number): DirectionConstant {
        switch (dx) {
            case 0: {
                switch (dy) {
                    case 1: {
                        return BOTTOM;
                    }
                    case -1: {
                        return TOP;
                    }
                    default: {
                        console.log("Error invalid dy for a pathstep");
                    }
                }
                break;
            }
            case 1: {
                switch (dy) {
                    case 0: {
                        return RIGHT;
                    }
                    case 1: {
                        return BOTTOM_RIGHT;
                    }
                    case -1: {
                        return TOP_RIGHT;
                    }
                    default: {
                        console.log("Error invalid dy for a pathstep");
                    }
                }
                break;
            }
            case -1: {
                switch (dy) {
                    case 0: {
                        return LEFT;
                    }
                    case 1: {
                        return BOTTOM_LEFT;
                    }
                    case -1: {
                        return TOP_LEFT;
                    }
                    default: {
                        console.log("Error invalid dy for a pathstep");
                    }
                }
                break;
            }
            default: {
                console.log("Error invalid dx for a pathstep");
                break;
            }
        }
        throw `dx: ${dx}  dy: ${dy} was invalid`;
    }

    protected getRoomPositionForDirection(rp: RoomPosition, dc: DirectionConstant): RoomPosition | null {
        switch (dc) {
            case TOP: {
                return new RoomPosition(rp.x, rp.y - 1, rp.roomName);
            }
            case TOP_RIGHT: {
                return new RoomPosition(rp.x + 1, rp.y - 1, rp.roomName);
            }
            case RIGHT: {
                return new RoomPosition(rp.x + 1, rp.y, rp.roomName);
            }
            case BOTTOM_RIGHT: {
                return new RoomPosition(rp.x + 1, rp.y + 1, rp.roomName);
            }
            case BOTTOM: {
                return new RoomPosition(rp.x, rp.y + 1, rp.roomName);
            }
            case BOTTOM_LEFT: {
                return new RoomPosition(rp.x - 1, rp.y + 1, rp.roomName);
            }
            case LEFT: {
                return new RoomPosition(rp.x - 1, rp.y, rp.roomName);
            }
            case TOP_LEFT: {
                return new RoomPosition(rp.x - 1, rp.y - 1, rp.roomName);
            }
        }
    }

    protected directionClockwise(dc: DirectionConstant): DirectionConstant {
        if (dc !== TOP_LEFT) {
            return <DirectionConstant>(<number>dc + 1);
        } else {
            return TOP;
        }
    }

    protected directionCounterClockwise(dc: DirectionConstant): DirectionConstant {
        if (dc !== TOP) {
            return <DirectionConstant>(<number>dc - 1);
        } else {
            return TOP_LEFT;
        }
    }

    protected existingDisqualifyingStructure(x: number, y: number, room: Room): boolean {
        const structure = room.lookForAt(LOOK_STRUCTURES, x, y).find(s => this.doesStructureDisqualify(s));
        if (structure) {
            return true;
        } else {
            return false;
        }
    }

    protected doesStructureDisqualify(s: Structure): boolean {
        return (
            s.structureType === STRUCTURE_SPAWN ||
            s.structureType === STRUCTURE_TOWER ||
            s.structureType === STRUCTURE_EXTENSION ||
            s.structureType === STRUCTURE_FACTORY ||
            s.structureType === STRUCTURE_LINK ||
            s.structureType === STRUCTURE_LAB ||
            s.structureType === STRUCTURE_CONTAINER ||
            s.structureType === STRUCTURE_CONTROLLER ||
            s.structureType === STRUCTURE_WALL ||
            s.structureType === STRUCTURE_ROAD
        );
    }

    //* Visualization helpers.
    protected visualizeBuild(buildOrders: BuildOrder[], roomName: string) {
        const rv: Visualizer = new Visualizer();
        rv.drawBuildOrders(buildOrders, roomName);
    }

    public visualizeCurrentStructureDistanceTransform(roomName: string) {
        const room: Room = Game.rooms[roomName];
        if (room) {
            const vis: Visualizer = new Visualizer();
            if (room.memory.structureDistanceTransform) {
                vis.visualizeCostMatrixDeserialized(
                    roomName,
                    PathFinder.CostMatrix.deserialize(room.memory.structureDistanceTransform)
                );
            } else {
                let allStructurePositions: RoomPosition[] = [];
                allStructurePositions = this.populateAllStructures(room);
                const ASDT: CostMatrix = this.distanceTransformOccupied(roomName, allStructurePositions, false);
                vis.visualizeCostMatrixDeserialized(roomName, ASDT);
                room.memory.structureDistanceTransform = ASDT.serialize();
            }
        }
    }

    public visualizeCurrentStructureDistanceTransformManhattan(roomName: string) {
        const room: Room = Game.rooms[roomName];
        if (room) {
            const vis: Visualizer = new Visualizer();
            if (room.memory.structureDistanceTransform) {
                vis.visualizeCostMatrixDeserialized(
                    roomName,
                    PathFinder.CostMatrix.deserialize(room.memory.structureDistanceTransform)
                );
            } else {
                let allStructurePositions: RoomPosition[] = [];
                allStructurePositions = this.populateAllStructures(room);
                const ASDT: CostMatrix = this.distanceTransformManhattanOccupied(
                    roomName,
                    allStructurePositions,
                    false
                );
                vis.visualizeCostMatrixDeserialized(roomName, ASDT);
                room.memory.structureDistanceTransform = ASDT.serialize();
            }
        }
    }

    public visualizeCurrentRoadAgnosticDistanceTransform(roomName: string) {
        const room: Room = Game.rooms[roomName];
        if (room) {
            const vis: Visualizer = new Visualizer();
            if (room.memory.roadAgnosticDistanceTransform) {
                vis.visualizeCostMatrixDeserialized(
                    roomName,
                    PathFinder.CostMatrix.deserialize(room.memory.roadAgnosticDistanceTransform)
                );
            } else {
                let allStructurePositions: RoomPosition[] = [];
                allStructurePositions = this.populateAllStructuresExceptRoads(room);
                const RADT: CostMatrix = this.distanceTransformOccupied(roomName, allStructurePositions, false);
                vis.visualizeCostMatrixDeserialized(roomName, RADT);
                room.memory.roadAgnosticDistanceTransform = RADT.serialize();
            }
        }
    }

    public visualizeCurrentRoadAgnosticDistanceTransformManhattan(roomName: string) {
        const room: Room = Game.rooms[roomName];
        if (room) {
            const vis: Visualizer = new Visualizer();
            if (room.memory.roadAgnosticDistanceTransform) {
                vis.visualizeCostMatrixDeserialized(
                    roomName,
                    PathFinder.CostMatrix.deserialize(room.memory.roadAgnosticDistanceTransform)
                );
            } else {
                let allStructurePositions: RoomPosition[] = [];
                allStructurePositions = this.populateAllStructuresExceptRoads(room);
                const RADT: CostMatrix = this.distanceTransformManhattanOccupied(
                    roomName,
                    allStructurePositions,
                    false
                );
                vis.visualizeCostMatrixDeserialized(roomName, RADT);
                room.memory.roadAgnosticDistanceTransform = RADT.serialize();
            }
        }
    }

    //* Structure populators for build planning
    protected populateAllStructures(room: Room): RoomPosition[] {
        let allStructurePositions = _.map(room.find(FIND_STRUCTURES), s => s.pos);
        const reservedBuildPositions = _.map(room.memory.reservedBuilds, rb => {
            return new RoomPosition(rb.x, rb.y, room.name);
        });
        return _.concat(allStructurePositions, reservedBuildPositions);
    }

    protected populateAllStructuresExceptRoads(room: Room): RoomPosition[] {
        let allStructurePositions = _.map(
            room.find(FIND_STRUCTURES, {
                filter: s => {
                    return s.structureType !== STRUCTURE_ROAD;
                }
            }),
            s => s.pos
        );
        const reservedBuildPositions = _.map(
            _.filter(room.memory.reservedBuilds, s => {
                return s.type !== STRUCTURE_ROAD;
            }),
            rb => {
                return new RoomPosition(rb.x, rb.y, room.name);
            }
        );
        return _.concat(allStructurePositions, reservedBuildPositions);
    }

    protected populateAllStructuresExceptExtensions(room: Room): RoomPosition[] {
        let allStructurePositions = _.map(
            room.find(FIND_STRUCTURES, {
                filter: s => {
                    return s.structureType !== STRUCTURE_EXTENSION;
                }
            }),
            s => s.pos
        );
        const reservedBuildPositions = _.map(
            _.filter(room.memory.reservedBuilds, s => {
                {
                    return s.type !== STRUCTURE_EXTENSION;
                }
            }),
            rb => {
                return new RoomPosition(rb.x, rb.y, room.name);
            }
        );
        return _.concat(allStructurePositions, reservedBuildPositions);
    }

    protected cleanDistanceTransformsForRoom(room: Room) {
        delete room.memory.roadAgnosticDistanceTransform;
        delete room.memory.structureDistanceTransform;
        delete room.memory.extensionAgnosticDistanceTransform;
    }

    //* Below here thar be algorithms
    protected traverseDistanceTransformWithCheckBounded(
        o: RoomPosition,
        serializedTransform: number[],
        threshold: number,
        serializedTransformCheck: number[],
        transformCheckThreshold: number,
        boundA: RoomPosition,
        boundB: RoomPosition
    ): RoomPosition | null {
        const transform: CostMatrix = PathFinder.CostMatrix.deserialize(serializedTransform);
        const transformCheck: CostMatrix = PathFinder.CostMatrix.deserialize(serializedTransformCheck);
        const xMinBound = Math.min(o.x, boundA.x, boundB.x);
        const xMaxBound = Math.max(o.x, boundA.x, boundB.x);
        const yMinBound = Math.min(o.y, boundA.y, boundB.y);
        const yMaxBound = Math.max(o.y, boundA.y, boundB.x);

        const X = 25;
        const Y = 25;
        let x: number, y: number, dx: number, dy: number;
        x = y = dx = 0;
        dy = -1;
        let t = Math.max(X, Y);
        let maxI = t * t;
        for (let i = 0; i < maxI; i++) {
            if (-X / 2 <= x && x <= X / 2 && -Y / 2 <= y && y <= Y / 2) {
                if (
                    this.inBoundary(o.x + x, o.y + y, xMinBound, xMaxBound, yMinBound, yMaxBound) &&
                    transform.get(o.x + x, o.y + y) >= threshold &&
                    transformCheck.get(o.x + x, o.y + y) >= transformCheckThreshold
                ) {
                    console.log(`x: ${o.x + x} y: ${o.y + y} roomName: ${o.roomName}`);
                    return new RoomPosition(o.x + x, o.y + y, o.roomName);
                }
            }
            if (x == y || (x < 0 && x == -y) || (x > 0 && x == 1 - y)) {
                t = dx;
                dx = -dy;
                dy = t;
            }
            x += dx;
            y += dy;
        }
        return null;
    }

    protected traverseDistanceTransformWithCheckBoundedExact(
        o: RoomPosition,
        serializedTransform: number[],
        threshold: number,
        serializedTransformCheck: number[],
        transformCheckThreshold: number,
        boundA: RoomPosition,
        boundB: RoomPosition,
        boundaryBuffer: number
    ): RoomPosition | null {
        const transform: CostMatrix = PathFinder.CostMatrix.deserialize(serializedTransform);
        const transformCheck: CostMatrix = PathFinder.CostMatrix.deserialize(serializedTransformCheck);
        const xMinBound = Math.max(Math.min(o.x, boundA.x, boundB.x) - boundaryBuffer, 1);
        const xMaxBound = Math.min(Math.max(o.x, boundA.x, boundB.x) + boundaryBuffer, 48);
        const yMinBound = Math.max(Math.min(o.y, boundA.y, boundB.y) - boundaryBuffer, 1);
        const yMaxBound = Math.min(Math.max(o.y, boundA.y, boundB.x) + boundaryBuffer, 48);

        const X = 25;
        const Y = 25;
        let x: number, y: number, dx: number, dy: number;
        x = y = dx = 0;
        dy = -1;
        let t = Math.max(X, Y);
        let maxI = t * t;
        for (let i = 0; i < maxI; i++) {
            if (-X / 2 <= x && x <= X / 2 && -Y / 2 <= y && y <= Y / 2) {
                if (
                    this.inBoundary(o.x + x, o.y + y, xMinBound, xMaxBound, yMinBound, yMaxBound) &&
                    transform.get(o.x + x, o.y + y) === threshold &&
                    transformCheck.get(o.x + x, o.y + y) === transformCheckThreshold
                ) {
                    return new RoomPosition(o.x + x, o.y + y, o.roomName);
                }
            }
            if (x == y || (x < 0 && x == -y) || (x > 0 && x == 1 - y)) {
                t = dx;
                dx = -dy;
                dy = t;
            }
            x += dx;
            y += dy;
        }
        return null;
    }

    protected traverseDistanceTransformBounded(
        o: RoomPosition,
        serializedTransform: number[],
        threshold: number,
        boundA: RoomPosition,
        boundB: RoomPosition
    ): RoomPosition | null {
        const transform: CostMatrix = PathFinder.CostMatrix.deserialize(serializedTransform);
        return this.traverseDistanceTransformBoundedDeserialized(o, transform, threshold, boundA, boundB);
    }

    protected traverseDistanceTransformBoundedDeserialized(
        o: RoomPosition,
        transform: CostMatrix,
        threshold: number,
        boundA: RoomPosition,
        boundB: RoomPosition
    ): RoomPosition | null {
        console.log("1");
        const xMinBound = Math.min(o.x, boundA.x, boundB.x);
        const xMaxBound = Math.max(o.x, boundA.x, boundB.x);
        const yMinBound = Math.min(o.y, boundA.y, boundB.y);
        const yMaxBound = Math.max(o.y, boundA.y, boundB.x);

        const X = 25;
        const Y = 25;
        let x: number, y: number, dx: number, dy: number;
        x = y = dx = 0;
        dy = -1;
        let t = Math.max(X, Y);
        let maxI = t * t;
        for (let i = 0; i < maxI; i++) {
            if (-X / 2 <= x && x <= X / 2 && -Y / 2 <= y && y <= Y / 2) {
                console.log(`x: ${o.x + x} | y: ${o.y + y}`);
                if (
                    this.inBoundary(o.x + x, o.y + y, xMinBound, xMaxBound, yMinBound, yMaxBound) &&
                    transform.get(o.x + x, o.y + y) >= threshold
                ) {
                    return new RoomPosition(o.x + x, o.y + y, o.roomName);
                }
            }
            if (x == y || (x < 0 && x == -y) || (x > 0 && x == 1 - y)) {
                t = dx;
                dx = -dy;
                dy = t;
            }
            x += dx;
            y += dy;
        }
        return null;
    }

    private inBoundary(x: number, y: number, xMin: number, xMax: number, yMin: number, yMax: number): boolean {
        if (x >= xMin && x <= xMax && y >= yMin && y <= yMax) {
            return true;
        } else {
            return false;
        }
    }

    protected traverseDistanceTransformWithCheck(
        o: RoomPosition,
        serializedTransform: number[],
        threshold: number,
        serializedTransformCheck: number[],
        transformCheckThreshold: number
    ): RoomPosition | null {
        const transform: CostMatrix = PathFinder.CostMatrix.deserialize(serializedTransform);
        const transformCheck: CostMatrix = PathFinder.CostMatrix.deserialize(serializedTransformCheck);

        const X = 25;
        const Y = 25;
        let x: number, y: number, dx: number, dy: number;
        x = y = dx = 0;
        dy = -1;
        let t = Math.max(X, Y);
        let maxI = t * t;
        for (let i = 0; i < maxI; i++) {
            if (-X / 2 <= x && x <= X / 2 && -Y / 2 <= y && y <= Y / 2) {
                if (
                    transform.get(o.x + x, o.y + y) >= threshold &&
                    transformCheck.get(o.x + x, o.y + y) >= transformCheckThreshold
                ) {
                    return new RoomPosition(o.x + x, o.y + y, o.roomName);
                }
            }
            if (x == y || (x < 0 && x == -y) || (x > 0 && x == 1 - y)) {
                t = dx;
                dx = -dy;
                dy = t;
            }
            x += dx;
            y += dy;
        }
        return null;
    }

    protected traverseDistanceTransform(
        o: RoomPosition,
        serializedTransform: number[],
        threshold: number
    ): RoomPosition | null {
        const transform: CostMatrix = PathFinder.CostMatrix.deserialize(serializedTransform);
        const X = 25;
        const Y = 25;
        let x: number, y: number, dx: number, dy: number;
        x = y = dx = 0;
        dy = -1;
        let t = Math.max(X, Y);
        let maxI = t * t;
        for (let i = 0; i < maxI; i++) {
            if (-X / 2 <= x && x <= X / 2 && -Y / 2 <= y && y <= Y / 2) {
                if (transform.get(o.x + x, o.y + y) >= threshold) {
                    return new RoomPosition(o.x + x, o.y + y, o.roomName);
                }
            }
            if (x == y || (x < 0 && x == -y) || (x > 0 && x == 1 - y)) {
                t = dx;
                dx = -dy;
                dy = t;
            }
            x += dx;
            y += dy;
        }
        return null;
    }

    protected traverseDistanceTransformDeserialized(
        o: RoomPosition,
        transform: CostMatrix,
        threshold: number
    ): RoomPosition | null {
        const X = 25;
        const Y = 25;
        let x: number, y: number, dx: number, dy: number;
        x = y = dx = 0;
        dy = -1;
        let t = Math.max(X, Y);
        let maxI = t * t;
        for (let i = 0; i < maxI; i++) {
            if (-X / 2 <= x && x <= X / 2 && -Y / 2 <= y && y <= Y / 2) {
                if (transform.get(o.x + x, o.y + y) >= threshold) {
                    return new RoomPosition(o.x + x, o.y + y, o.roomName);
                }
            }
            if (x == y || (x < 0 && x == -y) || (x > 0 && x == 1 - y)) {
                t = dx;
                dx = -dy;
                dy = t;
            }
            x += dx;
            y += dy;
        }
        return null;
    }

    protected traverseDistanceTransformWithCheckDiagonalQuick(
        t: RoomPosition,
        serializedTransform: number[],
        threshold: number,
        serializedTransformCheck: number[],
        transformCheckThreshold: number
    ): RoomPosition | null {
        const transform: CostMatrix = PathFinder.CostMatrix.deserialize(serializedTransform);
        const transformCheck: CostMatrix = PathFinder.CostMatrix.deserialize(serializedTransformCheck);
        let m = 0;
        while (m < 25) {
            console.log(`attempting m:${m}`);
            if (transform.get(t.x + m, t.y + m) >= threshold) {
                if (transformCheck.get(t.x + m, t.y + m) >= transformCheckThreshold) {
                    return new RoomPosition(t.x + m, t.y + m, t.roomName);
                }
            } else if (transform.get(t.x - m, t.y + m) >= threshold) {
                if (transformCheck.get(t.x - m, t.y + m) >= transformCheckThreshold) {
                    return new RoomPosition(t.x - m, t.y + m, t.roomName);
                }
            } else if (transform.get(t.x + m, t.y - m) >= threshold) {
                if (transformCheck.get(t.x + m, t.y - m) >= transformCheckThreshold) {
                    return new RoomPosition(t.x + m, t.y - m, t.roomName);
                }
            } else if (transform.get(t.x - m, t.y - m) >= threshold) {
                if (transformCheck.get(t.x - m, t.y - m) >= transformCheckThreshold) {
                    return new RoomPosition(t.x - m, t.y - m, t.roomName);
                }
            }
            m += 1;
        }
        return null;
    }

    protected traverseDistanceTransformDiagonalQuick(
        t: RoomPosition,
        transform: CostMatrix,
        threshold: number
    ): RoomPosition | null {
        let m = 0;
        while (m < 25) {
            if (transform.get(t.x + m, t.y + m) >= threshold) {
                return new RoomPosition(t.x + m, t.y + m, t.roomName);
            } else if (transform.get(t.x - m, t.y + m) >= threshold) {
                return new RoomPosition(t.x - m, t.y + m, t.roomName);
            } else if (transform.get(t.x + m, t.y - m) >= threshold) {
                return new RoomPosition(t.x + m, t.y - m, t.roomName);
            } else if (transform.get(t.x - m, t.y - m) >= threshold) {
                return new RoomPosition(t.x - m, t.y - m, t.roomName);
            }
            m += 1;
        }
        return null;
    }

    public distanceTransformRaw(roomName: string, logTransform: boolean) {
        const roomTerrain = Game.map.getRoomTerrain(roomName);
        let twoPass = new PathFinder.CostMatrix();
        for (let y = 1; y <= 48; y++) {
            for (let x = 1; x <= 48; x++) {
                if (roomTerrain.get(x, y) === TERRAIN_MASK_WALL) {
                    twoPass.set(x, y, 0);
                } else {
                    twoPass.set(x, y, 9);
                }
            }
        }
        for (let y = 1; y <= 48; y++) {
            for (let x = 1; x <= 48; x++) {
                twoPass.set(
                    x,
                    y,
                    Math.min(
                        twoPass.get(x, y),
                        twoPass.get(x - 1, y - 1) + 1,
                        twoPass.get(x, y - 1) + 1,
                        twoPass.get(x - 1, y) + 1
                    )
                );
            }
        }

        for (let y = 48; y >= 0; y--) {
            for (let x = 49; x >= 0; x--) {
                let value = Math.min(
                    twoPass.get(x, y),
                    twoPass.get(x + 1, y + 1) + 1,
                    twoPass.get(x, y + 1) + 1,
                    twoPass.get(x + 1, y) + 1
                );
                twoPass.set(x, y, value);
            }
        }
        if (logTransform) {
            this.logDistanceTransform(twoPass);
        }
        return twoPass;
    }

    protected distanceTransformOccupied(roomName: string, existingStructures: RoomPosition[], logTransform: boolean) {
        const roomTerrain = Game.map.getRoomTerrain(roomName);
        let twoPass = new PathFinder.CostMatrix();
        for (let y = 1; y <= 48; y++) {
            for (let x = 1; x <= 48; x++) {
                if (roomTerrain.get(x, y) === TERRAIN_MASK_WALL) {
                    twoPass.set(x, y, 0);
                } else {
                    twoPass.set(x, y, 9);
                }
            }
        }
        for (const s of existingStructures) {
            twoPass.set(s.x, s.y, 0);
        }
        for (let y = 1; y <= 48; y++) {
            for (let x = 1; x <= 48; x++) {
                twoPass.set(
                    x,
                    y,
                    Math.min(
                        twoPass.get(x, y),
                        twoPass.get(x - 1, y - 1) + 1,
                        twoPass.get(x, y - 1) + 1,
                        twoPass.get(x - 1, y) + 1
                    )
                );
            }
        }

        for (let y = 48; y >= 0; y--) {
            for (let x = 49; x >= 0; x--) {
                let value = Math.min(
                    twoPass.get(x, y),
                    twoPass.get(x + 1, y + 1) + 1,
                    twoPass.get(x, y + 1) + 1,
                    twoPass.get(x + 1, y) + 1
                );
                twoPass.set(x, y, value);
            }
        }
        if (logTransform) {
            this.logDistanceTransform(twoPass);
        }
        return twoPass;
    }

    protected distanceTransformManhattanOccupied(
        roomName: string,
        existingStructures: RoomPosition[],
        logTransform: boolean
    ) {
        const roomTerrain = Game.map.getRoomTerrain(roomName);
        let twoPass = new PathFinder.CostMatrix();
        for (let y = 1; y <= 48; y++) {
            for (let x = 1; x <= 48; x++) {
                if (roomTerrain.get(x, y) === TERRAIN_MASK_WALL) {
                    twoPass.set(x, y, 0);
                } else {
                    twoPass.set(x, y, 9);
                }
            }
        }
        for (const s of existingStructures) {
            twoPass.set(s.x, s.y, 0);
        }
        for (let y = 1; y <= 48; y++) {
            for (let x = 1; x <= 48; x++) {
                twoPass.set(x, y, Math.min(twoPass.get(x, y), twoPass.get(x, y - 1) + 1, twoPass.get(x - 1, y) + 1));
            }
        }

        for (let y = 48; y >= 0; y--) {
            for (let x = 49; x >= 0; x--) {
                let value = Math.min(twoPass.get(x, y), twoPass.get(x, y + 1) + 1, twoPass.get(x + 1, y) + 1);
                twoPass.set(x, y, value);
            }
        }
        if (logTransform) {
            this.logDistanceTransform(twoPass);
        }
        return twoPass;
    }

    private logDistanceTransform(matrix: CostMatrix) {
        for (let y = 0; y < 50; y++) {
            let buffer: string = "";
            for (let x = 0; x < 50; x++) {
                buffer += matrix.get(x, y);
            }
            console.log(buffer);
        }
    }
}
