import _ from "lodash";

export class BodyBuilder {
    public static FillMonotype(type: BodyPartConstant, size: number): BodyPartConstant[] {
        const move: BodyPartConstant[] = [];
        const work: BodyPartConstant[] = [];
        for (let i = 0; i < size; i++) {
            move.push(MOVE);
            work.push(type);
        }
        return _.concat(move, work);
    }

    public static FillDualType(
        typeA: BodyPartConstant,
        sizeA: number,
        typeB: BodyPartConstant,
        sizeB: number,
        addBulk?: boolean
    ): BodyPartConstant[] {
        let move: BodyPartConstant[] = [];
        const workA: BodyPartConstant[] = [];
        const workB: BodyPartConstant[] = [];
        for (let i = 0; i < sizeA; i++) {
            move.push(MOVE);
            workA.push(typeA);
        }
        for (let i = 0; i < sizeB; i++) {
            move.push(MOVE);
            workB.push(typeB);
        }
        if (addBulk) {
            const bulk: BodyPartConstant[] = [];
            for (let i = 0; i <= Math.floor((sizeA + sizeB) / 2); i++) {
                move.push(MOVE);
                bulk.push(TOUGH);
            }
            move = _.concat(bulk, move);
        }
        return _.concat(move, workA, workB);
    }
}
