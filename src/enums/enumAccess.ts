import _ from "lodash";

export class EnumsHelper {

    public static getEnumKeys(myEnum: any) {
        return _.filter(_.values(myEnum), (roleProp) => typeof roleProp === 'number');
    }

    public static getEnumValue(myEnum: any) {
        return _.filter(_.values(myEnum), (roleProp) => !(typeof roleProp === 'number'));
    }

}

interface Enum {
    [id: number]: string
}

