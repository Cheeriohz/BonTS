import { RoomEra } from "../enums/enum.roomEra"

//This is meant for easier modification of spawning thresholds. Not sure if there is a better way that doesn't hit memory.
export class spawnErasConfig {
    public stoneEraConfig: stoneEra = new stoneEra();
    public copperEraConfig: stoneEra = new copperEra();
    public bronzeEraConfig: bronzeEra = new bronzeEra();
}

class stoneEra {
    public constructor() {
        this.harvesters = 1;
        this.upgraders = 3;
        this.builders = 5;
    }
    public harvesters!: number;
    public upgraders!: number;
    public builders!: number;
}

class copperEra {
    public constructor() {
        this.harvesters = 2;
        this.upgraders = 3;
        this.builders = 2;
    }
    public harvesters!: number;
    public upgraders!: number;
    public builders!: number;
}

class bronzeEra {
    public constructor() {
        this.drones = 4;
        this.haulers = 2;
    }
    public drones!: number;
    public haulers!: number;
}

