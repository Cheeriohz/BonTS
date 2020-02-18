import _ from "lodash";

/* tslint:disable:ban-types */
export function init(): Profiler {
    const defaults = {
        data: {},
        total: 0
    };

    if (!Memory.profiler) {
        Memory.profiler = defaults;
    }

    const cli: Profiler = {
        clear() {
            const running = isEnabled();
            Memory.profiler = defaults;
            if (running) {
                Memory.profiler.start = Game.time;
            }
            return "Profiler Memory cleared";
        },

        output() {
            outputProfilerData();
            return "Done";
        },

        start() {
            Memory.profiler.start = Game.time;
            return "Profiler started";
        },

        status() {
            if (isEnabled()) {
                return "Profiler is running";
            }
            return "Profiler is stopped";
        },

        stop() {
            if (!isEnabled()) {
                return;
            }
            const timeRunning = Game.time - Memory.profiler.start!;
            Memory.profiler.total += timeRunning;
            delete Memory.profiler.start;
            return "Profiler stopped";
        },

        describe() {
            return `Profiler.start() - Starts the profiler\n Profiler.stop() - Stops/Pauses the profiler\n Profiler.status() - Returns whether is profiler is currently running or not\n Profiler.output() - Pretty-prints the collected profiler data to the console\n ${this.status()}`;
        }
    };

    return cli;
}

function wrapFunction(obj: object, key: PropertyKey, className?: string) {
    const descriptor = Reflect.getOwnPropertyDescriptor(obj, key);
    if (!descriptor || descriptor.get || descriptor.set) {
        return;
    }

    if (key === "constructor") {
        return;
    }

    const originalFunction = descriptor.value;
    if (!originalFunction || typeof originalFunction !== "function") {
        return;
    }

    // set a key for the object in memory
    if (!className) {
        className = obj.constructor ? `${obj.constructor.name}` : "";
    }
    const memKey = className + `:${key.toString()}`;

    // set a tag so we don't wrap a function twice
    const savedName = `__${key.toString()}__`;
    if (Reflect.has(obj, savedName)) {
        return;
    }

    Reflect.set(obj, savedName, originalFunction);

    ///////////

    Reflect.set(obj, key, function(this: any, ...args: any[]) {
        if (isEnabled()) {
            const start = Game.cpu.getUsed();
            const result = originalFunction.apply(this, args);
            const end = Game.cpu.getUsed();
            record(memKey, end - start);
            return result;
        }
        return originalFunction.apply(this, args);
    });
}

export function profile(target: Function): void;
export function profile(target: object, key: string | symbol, _descriptor: TypedPropertyDescriptor<Function>): void;
export function profile(
    target: object | Function,
    key?: string | symbol,
    _descriptor?: TypedPropertyDescriptor<Function>
): void {
    // Had to hard code this for now because the profiler variable is getting lost in the rollup.
    // __PROFILER_ENABLED__
    if (!true) {
        return;
    }
    if (key) {
        // case of method decorator
        wrapFunction(target, key);
        return;
    }

    // case of class decorator

    const ctor = target as any;
    if (!ctor.prototype) {
        return;
    }

    const className = ctor.name;
    Reflect.ownKeys(ctor.prototype).forEach(k => {
        wrapFunction(ctor.prototype, k, className);
    });
}

function isEnabled(): boolean {
    return Memory.profiler.start !== undefined;
}

function record(key: string | symbol, time: number) {
    if (typeof key === "symbol") {
        const symbolString = key.toString();
        recordSafely(symbolString, time);
    } else {
        recordSafely(key, time);
    }
}

function recordSafely(key: string, time: number) {
    if (!Memory.profiler.data[key]) {
        Memory.profiler.data[key] = {
            calls: 0,
            time: 0
        };
    }
    Memory.profiler.data[key].calls++;
    Memory.profiler.data[key].time += time;
}

interface OutputData {
    name: string;
    calls: number;
    cpuPerCall: number;
    callsPerTick: number;
    cpuPerTick: number;
}

function outputProfilerData() {
    let totalTicks = Memory.profiler.total;
    if (Memory.profiler.start) {
        totalTicks += Game.time - Memory.profiler.start;
    }

    ///////
    // Process data
    let totalCpu = 0; // running count of average total CPU use per tick
    let result: Partial<OutputData>;
    const data = _.map(Reflect.ownKeys(Memory.profiler.data), s => {
        if (typeof s === "symbol") {
            result = {
                calls: 0,
                callsPerTick: 0,
                cpuPerCall: 0,
                cpuPerTick: 0,
                name: "Symbols don't work"
            };
            return result as OutputData;
        }
        result = {};
        result.name = `${s}`;
        result.calls = Memory.profiler.data[s].calls;
        result.cpuPerCall = Memory.profiler.data[s].time / result.calls;
        result.callsPerTick = result.calls / totalTicks;
        result.cpuPerTick = Memory.profiler.data[s].time / totalTicks;
        totalCpu += result.cpuPerTick;
        return result as OutputData;
    });

    if (data) {
        data.sort((lhs, rhs) => rhs?.cpuPerTick - lhs?.cpuPerTick);

        ///////
        // Format data
        let output = "";

        // get function name max length
        const longestName = _.max(_.map(data, d => d?.name.length));

        //// Header line
        output += _.padEnd("Function", longestName);
        output += _.padStart("Tot Calls", 12);
        output += _.padStart("CPU/Call", 12);
        output += _.padStart("Calls/Tick", 12);
        output += _.padStart("CPU/Tick", 12);
        output += _.padStart("% of Tot\n", 12);

        _.forEach(data, d => {
            output += _.padEnd(`${d?.name}`, longestName);
            output += _.padStart(`${d?.calls}`, 12);
            output += _.padStart(`${d?.cpuPerCall.toFixed(2)}ms`, 12);
            output += _.padStart(`${d?.callsPerTick.toFixed(2)}`, 12);
            output += _.padStart(`${d?.cpuPerTick.toFixed(2)}ms`, 12);
            if (d?.cpuPerTick) {
                output += _.padStart(`${((d.cpuPerTick / totalCpu) * 100).toFixed(0)} %\n`, 12);
            }
        });
        //// Footer line
        output += `${totalTicks} total ticks measured`;
        output += `\t\t\t${totalCpu.toFixed(2)} average CPU profiled per tick`;
        console.log(output);
    }
}
