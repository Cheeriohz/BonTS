Most basic harvester spawn
---------------------------
Game.spawns['Sp1'].spawnCreep([WORK,CARRY,MOVE], "Harvester" + Game.time.toString(), {memory: {role: 0, working: false}});

Bronze Era Spawns
---------------------------
Game.spawns['Sp1'].spawnCreep([WORK, WORK, WORK, WORK, WORK, WORK, MOVE], "Dropper" + Game.time.toString(), {memory: {role: 3, working: false}});
Game.spawns['Sp1'].spawnCreep([CARRY,CARRY,MOVE], "Hauler" + Game.time.toString(), {memory: {role: 4, working: false}});
Game.spawns['Sp1'].spawnCreep([CARRY, CARRY, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], "Drone" + Game.time.toString(), {memory: {role: 5, working: false}});

Dedicated Scout
---------------------------
Game.spawns['Sp1'].spawnCreep([MOVE], "dScout" + Game.time.toString(), {memory: {role: 6, working: true, orders: { target: "W31S49", independentOperator: true }}});

