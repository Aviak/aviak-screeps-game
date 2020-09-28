var pathfinding = require('general/aviak-screeps-game/pathfinding');

var roleReserverLvl5 = {

    /** @param {Creep} creep **/
    run: function (creep) {
        //creep.moveTo(Game.flags.IdleFlag);
        //return;
        //initialize memory
        //creep.memory.longDistanceMining = undefined;
        //console.log('' + creep + ' ' + creep.memory.longDistanceMining);

        if(!creep.room.memory.reserving) {
            creep.room.memory.reserving = {};
        }
        if(!creep.memory.reserveRoom && creep.room.memory.reserving.reserveRoom) {
            creep.memory.reserveRoom = creep.room.memory.reserving.reserveRoom;
        }
        if(!creep.memory.reserveRoom) {
            return;
        }

        if (!creep.memory.reserving) {
            //console.log('INIT CLAIMER');
            creep.memory.reserving = {};
            //let miningLocations = _.filter(this.getMiningLocations(), (elem) => elem.maxMiners > 0);
            //console.log('miningLocations=' + miningLocations);


            // creep.memory.longDistanceMining.room = location.room;
            // creep.memory.longDistanceMining.x = location.x;
            // creep.memory.longDistanceMining.y = location.y;

            //console.log('2222');

        }
        let roomName = creep.memory.reserveRoom;
        if (creep.room.name !== roomName && !creep.memory.reserving.exitToRoom) {
            // console.log('1111');
            let exitCode = creep.room.findExitTo(roomName);
            let exitPos = creep.pos.findClosestByPath(exitCode, {ignoreCreeps: true});
            //console.log('INIT MINER');
            if (!exitPos) {
                //wait a turn
                //console.log('WAIT A TURN');
                //console.log('3333');
                creep.memory.reserving = undefined;
                return;
            }
            creep.memory.reserving.exitToRoom = { x: exitPos.x, y: exitPos.y};
        }


        if (creep.room.name === creep.memory.reserveRoom) {
            //console.log('claim 1');
            let res = creep.reserveController(creep.room.controller);
            //console.log(res);
            if(res === ERR_NOT_IN_RANGE) {
                //console.log('claim 2');
                creep.moveTo(creep.room.controller);
            }
        } else if (creep.room.name !== creep.memory.reserveRoom) {
            //console.log('claim 3');
            creep.moveTo(new RoomPosition(creep.memory.reserving.exitToRoom.x, creep.memory.reserving.exitToRoom.y, creep.room.name));
        }



    }
};


module.exports = roleReserverLvl5;