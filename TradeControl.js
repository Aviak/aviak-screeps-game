let tradeControl = {
    run : function(room) {
        if(!room.terminal) {
            return;
        }
        if(!Memory.structures['id'+room.terminal.id]) {
            Memory.structures['id'+room.terminal.id] = {};
        }
        let terminalMemory = Memory.structures['id'+room.terminal.id];
        if(!Memory.trade.resourcePrices || (Game.time % 87 === 0)) {
            calculateResourcePrices();
        }

        let energyAvailable = 0;
        for(let resource in room.terminal.store) {
            if(resource === RESOURCE_ENERGY) {
                energyAvailable += room.terminal.store[resource];
            }
            else {
                sellResource(resource, room.terminal.store.getUsedCapacity(resource), energyAvailable, room);
            }
        }
    },
    sellResource : function(resourceType, amount, energyAvailable, room) {
        let terminalMemory = Memory.structures['id'+room.terminal.id];
        if(!terminalMemory.)
    },
    calculateResourcePrices : function(){
        Memory.trade.resourcePrices = {};
        let priceHistory = Game.market.getHistory();
        let yesterday = new Date();
        yesterday.setDate(yesterday.getDate()-5);
        yesterday = yesterday.toISOString().slice(0, 10)
        for(let i in priceHistory) {
            let el = priceHistory[i];
            if(el.date === yesterday) {
                Memory.trade.resourcePrices[el.resourceType] = {
                    avgPrice : el.avgPrice,
                    stddevPrice : el.stddevPrice,
                    minPrice : el.avgPrice-el.stddevPrice,
                    maxPrice : el.avgPrice+el.stddevPrice
                }
            }
        }
    }
};


module.exports = tradeControl;