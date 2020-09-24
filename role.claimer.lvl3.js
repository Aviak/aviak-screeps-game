var roleLongDistanceMinerLvl3 = {

    /** @param {Creep} creep **/
    run: function (creep) {
        //creep.moveTo(Game.flags.IdleFlag);
        //return;
        //initialize memory
        //creep.memory.longDistanceMining = undefined;
        //console.log('' + creep + ' ' + creep.memory.longDistanceMining);

        if(!Memory.claiming) {
            Memory.claiming = {};
        }
        if(!Memory.claiming.claimRoom) {
            return;
        }

        if (!creep.memory.claiming) {
            //console.log('INIT CLAIMER');
            creep.memory.claiming = {};
            //let miningLocations = _.filter(this.getMiningLocations(), (elem) => elem.maxMiners > 0);
            //console.log('miningLocations=' + miningLocations);


            // creep.memory.longDistanceMining.room = location.room;
            // creep.memory.longDistanceMining.x = location.x;
            // creep.memory.longDistanceMining.y = location.y;

            //console.log('2222');

        }
        let roomName = Memory.claiming.claimRoom;
        if (creep.room.name !== roomName && !creep.memory.claiming.exitToRoom) {
           // console.log('1111');
            let exitCode = creep.room.findExitTo(roomName);
            let exitPos = creep.pos.findClosestByPath(exitCode, {ignoreCreeps: true});
            //console.log('INIT MINER');
            if (!exitPos) {
                //wait a turn
                //console.log('WAIT A TURN');
                //console.log('3333');
                creep.memory.claiming = undefined;
                return;
            }
            creep.memory.claiming.exitToRoom = { x: exitPos.x, y: exitPos.y};
        }


        if (creep.room.name === Memory.claiming.claimRoom) {
            console.log('claim 1');
            let res = creep.attackController(creep.room.controller);
            console.log(res);
            if(res === ERR_NOT_IN_RANGE) {
                console.log('claim 2');
                creep.moveTo(creep.room.controller);
            }
        } else if (creep.room.name !== Memory.claiming.claimRoom) {
            console.log('claim 3');
            creep.moveTo(new RoomPosition(creep.memory.claiming.exitToRoom.x, creep.memory.claiming.exitToRoom.y, creep.room.name));
        }



    }
};


module.exports = roleLongDistanceMinerLvl3;