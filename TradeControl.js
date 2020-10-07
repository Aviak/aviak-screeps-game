let tradeControl = {
    run : function(room) {
        if(!room.terminal) {
            return;
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

    }
};


module.exports = tradeControl;