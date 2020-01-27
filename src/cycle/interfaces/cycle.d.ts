interface RCLUpgradeEvent {
    newRclLevel: number;
}

interface CreepRequest {
    role: number;
    body: any[];
    memory?: CreepMemory | null;
}

interface DedicatedCreepRequest extends CreepRequest {
    dedication: string;
    specifiedName: string;
}
