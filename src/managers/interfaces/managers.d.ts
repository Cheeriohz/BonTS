interface Mine {
    extractorId: Id<StructureExtractor>;
    containerId: Id<StructureContainer>;
    miner: string;
    hauler: string;
    type: MineralConstant | DepositConstant;
    vein: Id<Mineral> | Id<Deposit>;
}
