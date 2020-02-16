Most basic harvester spawn
---------------------------
Game.spawns['A'].spawnCreep([WORK,CARRY,MOVE], "Harvester" + Game.time.toString(), {memory: {role: 0, working: false}});
Game.spawns['A'].spawnCreep([WORK, WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY], "upg" + Game.time.toString(), {memory: {role: 1, working: false}});

Game.spawns['A'].spawnCreep([WORK,WORK,CARRY,CARRY,MOVE,MOVE], "Builder" + Game.time.toString(), {memory: {role: 2, working: false}});

Game.spawns['A'].spawnCreep([WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE], "Bld" + Game.time.toString(), {memory: {role: 2, working: false}});

Bronze Era Spawns
---------------------------
Game.spawns['A'].spawnCreep([WORK, WORK, WORK, WORK, WORK, WORK, MOVE], "Dropper" + Game.time.toString(), {memory: {role: 3, working: false}});
Game.spawns['A'].spawnCreep([CARRY,CARRY,MOVE], "Hauler" + Game.time.toString(), {memory: {role: 4, working: false}});
Game.spawns['A'].spawnCreep([CARRY, CARRY, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], "Drone" + Game.time.toString(), {memory: {role: 5, working: false}});

Game.spawns['A'].spawnCreep([MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY], "Drone" + Game.time.toString(), {memory: {role: 5, working: false}});



Dedicated Scout
---------------------------
Game.spawns['A'].spawnCreep([MOVE], "dScout" + Game.time.toString(), {memory: {role: 6, working: true, orders: { target: "W31S49", independentOperator: true }}});


Game.spawns['A'].spawnCreep([ATTACK,ATTACK,ATTACK,ATTACK,TOUGH,TOUGH,TOUGH,TOUGH,HEAL,HEAL,MOVE,MOVE,MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], "patrol" + Game.time.toString(), {memory: {role: 8, working: false, orders: {target: "W30S50", independentOperator: false }}});

Game.spawns['A'].spawnCreep([CARRY,CARRY,MOVE], "top" + Game.time.toString(), {memory: {role: 9, working: false}});

Combat
---------------------------
Game.spawns['A'].spawnCreep([MOVE,MOVE, MOVE, MOVE,MOVE,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK], "grunt" + Game.time.toString(), {memory: {role: 8, working: false, home: "W31S51", orders: {target: "W29S49", independentOperator: false }}});

Game.spawns['A'].spawnCreep([TOUGH,TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK], "patrol" + Game.time.toString(), {memory: {role: 8, working: false, home: "W31S51", orders: {target: "W29S49", independentOperator: false }}});

Game.spawns['A'].spawnCreep([TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,ATTACK,ATTACK,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL], "patrol" + Game.time.toString(), {memory: {role: 8, working: false, home: "W31S51", orders: {target: "W29S49", independentOperator: false }}});
