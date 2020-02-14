export function CreepQualifiesAsActive(name: string, additionalBuffer?: number): boolean {
    const creep: Creep | null = Game.creeps[name];
    if (creep) {
        return CreepIsYouthful(creep, additionalBuffer);
    }
    return false;
}

export function CreepIsYouthful(creep: Creep, additionalBuffer?: number) {
    if (
        !creep.ticksToLive ||
        creep.ticksToLive > creep.body.length * CREEP_SPAWN_TIME + __spawn_buffer_ticks__ + (additionalBuffer ?? 0)
    ) {
        return true;
    } else {
        return false;
    }
}
