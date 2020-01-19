import { RoomEra } from "../enums/enum.roomEra"
import { StoneEra } from "./configurable.StoneEra";
import { CopperEra } from "./configurable.CopperEra";
import { BronzeEra } from "./configurable.BronzeEra";

// This is meant for easier modification of spawning thresholds. Not sure if there is a better way that doesn't hit memory.
export class SpawnErasConfig {
    public stoneEraConfig: StoneEra = new StoneEra();
    public copperEraConfig: CopperEra = new CopperEra();
    public bronzeEraConfig: BronzeEra = new BronzeEra();
}

