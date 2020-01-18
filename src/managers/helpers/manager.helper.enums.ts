import _ from "lodash";

export class enumsHelper {

    public static getEnumKeys(myEnum: any) {
        return _.filter(_.values(myEnum), function (roleProp) { return typeof roleProp === 'number'; });
    }

    public static getEnumValue(myEnum: any) {
        return _.filter(_.values(myEnum), function (roleProp) { return !(typeof roleProp === 'number'); });
    }

}

interface Enum {
    [id: number]: string
}

