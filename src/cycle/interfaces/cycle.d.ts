interface RCLUpgradeEvent {
    newRclLevel: number;
}

interface CreepRequest {
    role: number;
    body: any[];
}

interface DedicatedCreepRequest extends CreepRequest {
    dedication: string;
    specifiedName: string;
}
