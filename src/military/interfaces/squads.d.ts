interface Squad {
    type: number;
    wellStaffed: boolean;
    theatre: string;
    pos: [number, number];
    enlistees: string[];
    activeCombatZone: boolean;
    squadName: string;
    path?: PathStep[];
    focus?: string | null;
    cacheDirection?: DirectionConstant | null;
}
