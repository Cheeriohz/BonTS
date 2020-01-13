interface CreepMemory {
  role: number;
  working: boolean;
}

interface RoomMemory {
  era: number;
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
