import _ from "lodash";

export class MarketSellOverflow {
    private room!: Room;
    private terminal!: StructureTerminal | undefined;
    private storage!: StructureStorage | undefined;

    private energySelloffThreshold: number = 800000;
    private minEnergyToSell: number = 1000;

    constructor(room: Room) {
        this.room = room;
        this.terminal = room.terminal;
        this.storage = room.storage;
    }

    public checkAndSellOverflow() {
        if (this.terminal && this.storage) {
            if (this.storage.store.getUsedCapacity(RESOURCE_ENERGY) > this.energySelloffThreshold) {
                const energySellIndex = Memory.market.marketIndex.sellIndex[RESOURCE_ENERGY];
                if (energySellIndex) {
                    let terminalEnergyOnHand = this.terminal.store.getUsedCapacity(RESOURCE_ENERGY) / 2;
                    for (const order of _.sortBy(
                        Game.market.getAllOrders(o => {
                            return (
                                o.type === ORDER_BUY && o.resourceType === RESOURCE_ENERGY && o.price > energySellIndex
                            );
                        }),
                        o => -o.price
                    )) {
                        if (terminalEnergyOnHand > this.minEnergyToSell) {
                            terminalEnergyOnHand = this.tryDeal(order, terminalEnergyOnHand);
                        }
                    }
                }
            }
        }
    }

    private tryDeal(order: Order, energyOnHand: number): number {
        if (order.roomName) {
            const amountToSell = Math.min(order.remainingAmount, energyOnHand);

            const transferEnergyCost = Game.market.calcTransactionCost(amountToSell, this.room.name, order.roomName);

            if (Game.market.deal(order.id, amountToSell, this.room.name) === OK) {
                console.log(
                    `Deal made on ${amountToSell} at price ${order.price} for transfercost: ${transferEnergyCost}`
                );
            }
            energyOnHand = energyOnHand - transferEnergyCost - amountToSell;
        }

        return energyOnHand;
    }
}
