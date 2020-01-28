interface RCLUpgradeEvent {
    newRclLevel: number;
}

interface CreepRequest {
    role: number;
    body: any[];
    memory?: CreepMemory | null;
    home?: string | null;
    precious?: string | null;
}

interface DedicatedCreepRequest extends CreepRequest {
    dedication: string;
    specifiedName: string;
    orders?: CreepOrder
}
