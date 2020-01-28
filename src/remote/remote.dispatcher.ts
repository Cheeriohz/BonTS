import _ from "lodash";

export class RemoteDispatcher {

    public RequestDispatch(dispatchRequest: RemoteDispatchRequest, pathingLookup: PathingLookup): PathStep[] | null {
        let index = 1;
        if (dispatchRequest.departing) {
            index = 0;
        }
        console.log(JSON.stringify(pathingLookup.pathingLookup));
        const path = pathingLookup.pathingLookup[dispatchRequest.creep.room.name][index];
        console.log(`acquired path is: ${path}`);
        if (path) {
            return this.cutPath(dispatchRequest.creep.pos, path);//this.routeToPath(dispatchRequest.creep.pos, path);
        }
        else {
            return null;
        }
    }

    private cutPath(pos: RoomPosition, path: PathStep[]): PathStep[] {

        return _.dropWhile(path, (p) => { return p.x !== pos.x || p.y !== pos.y; });
    }

    private routeToPath(pos: RoomPosition, path: PathStep[]): PathStep[] {
        console.log(`Attempting to route to path`);
        let lastDistance: number = 80;
        for (const [i, v] of path.entries()) {
            const currentDistance = this.getDistanceDelta(pos, v);
            if (currentDistance === 0) {
                return _.concat(this.routeToPoint(pos, v), _.drop(path, i + 1));
            }
            else if (currentDistance > lastDistance) {
                // Though imprecise, this should help short circuit a more robust lookup and help pair us up decently well.
                return _.concat(this.routeToPoint(pos, v), _.drop(path, i + 1));
            }
            else {
                lastDistance = currentDistance;
            }
        }
        // Probably should never get here...
        console.log("Interim Routing Failure in dispatcher")
        return path;
    }

    private routeToPoint(pos: RoomPosition, point: PathStep): PathStep[] {
        return pos.findPathTo(point.x, point.y);
    }

    private getDistanceDelta(pos: RoomPosition, point: PathStep): number {
        return Math.hypot((pos.x - point.x), (pos.y - point.y));
    }
}
