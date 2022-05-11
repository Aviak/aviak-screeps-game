let pathfinding = require('pathfinding');

let roleUpgraderLvl3 = {

    /** @param {Creep} creep **/
    run: function(creep) {

        if(creep.memory.upgrading && creep.store.getUsedCapacity() === 0) {
            creep.memory.upgrading = false;
        }

        if(!creep.memory.upgrading) {
            let targetContainer = creep.pos.findClosestByPath(FIND_STRUCTURES,{
                filter: (structure) => structure.structureType === STRUCTURE_CONTAINER
                                        && structure.store[RESOURCE_ENERGY] >= creep.store.getFreeCapacity()
                                        && Memory.structures['id'+structure.id]
                                        && (Memory.structures['id'+structure.id].containerType === 'Request'
                                            || (Memory.structures['id'+structure.id].containerType === 'Harvest' && structure.store[RESOURCE_ENERGY] >= 1000)
                                            || (Memory.structures['id'+structure.id].containerType === 'Provider' && structure.store[RESOURCE_ENERGY] >= 1000))
            });
            if(!targetContainer) {
                targetContainer = creep.pos.findClosestByPath(FIND_STRUCTURES,{
                    filter: (structure) => (structure.structureType === STRUCTURE_CONTAINER || structure.structureType === STRUCTURE_STORAGE)
                        && structure.store[RESOURCE_ENERGY] >= creep.store.getFreeCapacity()
                });
            }
            if(targetContainer) {
                if(creep.pos.getRangeTo(targetContainer) > 1) {
                    //creep.moveTo(targetContainer, {visualizePathStyle: {stroke: '#ffaa00'}});
                    pathfinding.modMoveTo(creep, targetContainer.pos, 1);
                }
                if(creep.withdraw(targetContainer, RESOURCE_ENERGY) === OK) {
                    creep.memory.upgrading = true;
                }
            }
            if(creep.store.getFreeCapacity() === 0) {
                creep.memory.upgrading = true;
            }
        }
        if(creep.memory.upgrading) {
            let rangeToController = creep.pos.getRangeTo(creep.room.controller);
            if(rangeToController > 3) {
                //creep.moveTo(creep.room.controller, {visualizePathStyle: {stroke: '#ffaa00'}});
                // console.log(JSON.stringify(creep.room.controller.pos));
                pathfinding.modMoveTo(creep, creep.room.controller.pos, 3);
            }
            else if(rangeToController > 2) {
                pathfinding.modMoveTo(creep, creep.room.controller.pos, 2);
            }
            // else if(rangeToController > 1) {
            //     pathfinding.modMoveTo(creep, creep.room.controller.pos, 1);
            // }
            creep.upgradeController(creep.room.controller);
        }
    }
    ,

    getBody : function (energyAvailable) {
        let cost = 0;
        let body = [];
        let workParts = 0;
        let carryParts = 0;
        let moveParts = 0;
        let partsAdded = true;
        while(cost<energyAvailable && partsAdded) {
            partsAdded = false;
            if(workParts / carryParts > 5 || carryParts === 0) {
                let nextCarryAddCost = 50 + ((workParts+carryParts+1 > moveParts*2) ? 50 : 0);
                if(cost+nextCarryAddCost <= energyAvailable || carryParts === 0) {
                    partsAdded = true;
                    body.push(CARRY);
                    carryParts++;
                    cost+=50;
                    if(workParts+carryParts > moveParts*2 || moveParts === 0) {
                        body.push(MOVE);
                        moveParts++;
                        cost+=50;
                    }
                }
            }

            let nextWorkAddCost = 100 + ((workParts+carryParts+1 > moveParts*2) ? 50 : 0);
            if(cost+nextWorkAddCost <= energyAvailable || workParts === 0) {
                partsAdded = true;
                body.push(WORK);
                workParts++;
                cost+=100;
                if(workParts+carryParts > moveParts*2) {
                    body.push(MOVE);
                    moveParts++;
                    cost+=50;

                }
            }
        }
        // console.log(JSON.stringify(body));
        return body;
    }
};

module.exports = roleUpgraderLvl3;