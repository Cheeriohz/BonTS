interface Market {
    marketIndex: MarketIndex;
    logistics: TradeLogistics;
}

interface MarketIndex {
    sellIndex: Dictionary<number>;
}

interface TradeLogistics {
    storageHeaps: StorageHeap[];
    transitRequests: Dictionary<TransitRequest[]>;
}

interface StorageHeap {
    id: string;
    store: Store<ResourceConstant, false>;
}

interface TransitRequest {
    commodity: ResourceConstant;
    destination: string;
    origination: string;
    amount: number;
}

interface RoomTransitLogistics {
    activeRequest: TransitRequest | null;
    receiving: boolean;
}
