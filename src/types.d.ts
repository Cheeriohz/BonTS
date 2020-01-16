import { Dictionary } from "lodash";

interface CreepMemory {
  role: number;
  working: boolean;
}

interface RoomMemory {
  era: number;
  sourceMap: Array<Array<string>>;
}

interface Memory {
  uuid: number;
  log: any;
}

// `global` extension samples
declare namespace NodeJS {
  interface Global {
    log: any;
  }
}
