let tradeControl = {
    // buyOrders : undefined,
    run : function(room) {
        if(!room.terminal) {
            return;
        }
        if(!Memory.structures['id'+room.terminal.id]) {
            Memory.structures['id'+room.terminal.id] = {};
        }
        if(!Memory.trade) {
            Memory.trade = {resourcePrices : {}};
        }
        // this.buyOrders = undefined;

        let energyAvailable = 0;
        for(let resource in room.terminal.store) {
            if(resource === RESOURCE_ENERGY) {
                energyAvailable += room.terminal.store[resource];
            }
            else {
                this.processResourceData(resource, room.terminal.store.getUsedCapacity(resource), energyAvailable, room);
            }
        }
        this.sellResources(room);
    },
    processResourceData : function(resourceType, amount, energyAvailable, room) {
        let terminalMemory = Memory.structures['id'+room.terminal.id];
        if(!terminalMemory.processedData) {
            terminalMemory.processedData = {};
        }
        if(!terminalMemory.processedData[resourceType]) {
            terminalMemory.processedData[resourceType] = 0;
        }
        if(!terminalMemory.pendingOrders) {
            terminalMemory.pendingOrders = [];
        }
        if(terminalMemory.processedData[resourceType] < amount) {
            let amountToSell = amount - terminalMemory.processedData[resourceType];
            let targetPrice = this.getResourcePrice(resourceType);
            let buyOrders = Game.market.getAllOrders({type : ORDER_BUY, resourceType : resourceType});
            let energyPrice = this.getResourcePrice(RESOURCE_ENERGY);
            console.log('orders for '+resourceType+': ' + buyOrders.length);
            for(let i in buyOrders) {
                let order = buyOrders[i];
                let orderAmount = Math.min(amountToSell, order.amount);
                let energyRequired = Game.market.calcTransactionCost(orderAmount, room.name, order.roomName);
                console.log('energy required: ' + energyRequired);
                let orderPrice = order.price*order.amount - energyPrice.avgPrice * energyRequired;
                console.log('order price: ' + orderPrice);
                let orderPriceForUnit = orderPrice / order.amount;
                console.log('order price for unit: ' + orderPriceForUnit);
                console.log('target price: '+JSON.stringify(targetPrice));
                if(orderPriceForUnit >= targetPrice.minPrice) {
                    terminalMemory.processedData[resourceType] += orderAmount;
                    amountToSell -= orderAmount;
                    terminalMemory.pendingOrders.push({buyOrderId : order.id, amount : orderAmount, energyRequired : energyRequired, resourceType : resourceType});
                }
                if(amountToSell === 0) {
                    break;
                }
            }
        }
        let totalEnergyRequired = 0;
        for(let i in terminalMemory.pendingOrders) {
            totalEnergyRequired += terminalMemory.pendingOrders[i].energyRequired;
        }
        terminalMemory.totalEnergyRequired = totalEnergyRequired;
    },
    calculateResourcePrices : function(date){
        Memory.trade.resourcePrices = {date : date};
        let priceHistory = Game.market.getHistory();
        for(let i in priceHistory) {
            let el = priceHistory[i];
            if(el.date === date) {
                Memory.trade.resourcePrices[el.resourceType] = {
                    avgPrice : el.avgPrice,
                    stddevPrice : el.stddevPrice,
                    minPrice : el.avgPrice-el.stddevPrice,
                    maxPrice : el.avgPrice+el.stddevPrice
                }
            }
        }
    },
    getResourcePrice : function(resourceType) {
        let yesterday = new Date();
        yesterday.setDate(yesterday.getDate()-5);
        yesterday = yesterday.toISOString().slice(0, 10);
        if(!Memory.trade.resourcePrices[resourceType] || Memory.trade.resourcePrices.date !== yesterday) {
            this.calculateResourcePrices(yesterday);
        }
        return Memory.trade.resourcePrices[resourceType];
    },
    sellResources : function(room) {
        let terminalEnergy = room.terminal.store.getUsedCapacity(RESOURCE_ENERGY);
        let terminalMemory = Memory.structures['id'+room.terminal.id];
        for(let i in terminalMemory.pendingOrders) {
            let order = terminalMemory.pendingOrders[i];
            if(order.energyRequired <= terminalEnergy) {
                terminalEnergy -= order.energyRequired;
                let buyOrder = Game.market.getOrderById(order.buyOrderId);
                if(buyOrder && buyOrder.amount >= order.amount) {
                    let res = Game.market.deal(order.buyOrderId, order.amount);
                    console.log('DEAL ' + order.amount + ' ' + order.resourceType + ' ' + buyOrder.price + ' each ' + res);
                }
                terminalMemory.pendingOrders.splice(i,1);
                terminalMemory.processedData[order.resourceType]-=order.amount;
            }
        }
    }
};


module.exports = tradeControl;