import { remoteMineExpeditionHandler } from "./manager.remoteMineExpedition"

export class ExpeditionResultsHandlerMapper {
    public static getMap() {
        const expeditionResultsHandlerMap = new Map<string, IExpeditionResultsHandlerConstructor>()
        expeditionResultsHandlerMap.set('remoteMiningSource', remoteMineExpeditionHandler)
        return expeditionResultsHandlerMap;
    }
}
