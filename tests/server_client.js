var repl = require('../index');
var test = require('tape');

function serverStockWorld() {
  var world = stockWorld();

  world.runAs(repl.NetworkMode.Server, {
    port: 5000,
  });

  return world;
}

function clientStockWorld() {
  var world = stockWorld();

  world.runAs(repl.NetworkMode.Client, {
    host: 'localhost',
    port: 5000,
  });

  return world;
}

function stockWorld() {
  var world = new repl.World();

  world.defineEntity("point-mass", {
    vars: {
      x: 0,
      y: 0,
      mass: 1,
    },

    funcs: {
      teleportFixed: ["server", function() {
        this.x = 50;
        this.y = 60;
      }],

      teleportTo: ["server", function(toX, toY) {
        this.x = toX;
        this.y = toY;
      }],
    },

    replication: function(vars) {
      if (this.role === repl.Role.Authority) {
        vars.push('x', 'y', 'mass');
      }
    },
  });

  return world;
}

test('create server entity', function(t) {
  var serverWorld = serverStockWorld();
  // var clientWorld = clientStockWorld();

  var pmass = serverWorld.createEntity("point-mass");
  t.equal(pmass.type, "point-mass");
  t.equal(pmass.mass, 1);
  t.equal(pmass.x, 0);

  pmass.x = 17;
  t.equal(pmass.mass, 1);
  t.equal(pmass.x, 17);

  t.end();
});

test('create client entity', function(t) {
  var clientWorld = clientStockWorld();

  var pmass = clientWorld.createEntity("point-mass");
  t.equal(pmass.type, "point-mass");
  t.equal(pmass.mass, 1);
  t.equal(pmass.x, 0);

  pmass.x = 17;
  t.equal(pmass.mass, 1);
  t.equal(pmass.x, 17);

  t.end();
});

test('network endpoint exists', function(t) {
  var world = serverStockWorld();

  var endpoint = world.createNetworkEndpoint();
  t.notEqual(endpoint, null);
  t.notEqual(endpoint, undefined);

  t.equals(typeof endpoint.onCreateEntity, 'function');
  t.equals(typeof endpoint.onDestroyEntity, 'function');
  t.equals(typeof endpoint.onUpdateEntityVars, 'function');
  t.equals(typeof endpoint.onRunEntityFunction, 'function');

  t.equals(typeof endpoint.createEntity, 'function');
  t.equals(typeof endpoint.destroyEntity, 'function');
  t.equals(typeof endpoint.updateEntityVars, 'function');
  t.equals(typeof endpoint.runEntityFunction, 'function');

  // endpoint.createEntity = function(entity_id) {
  // };
  // endpoint.destroyEntity = function(entity_id) {
  // };
  // endpoint.setEntityVars = function(entity_id, vars) {
  // };
  // endpoint.runEntityFunction = function(entity_id, funcName, args) {
  // };
  // endpoint.onCreateEntity(14);
  // endpoint.onDestroyEntity(88);
  // endpoint.onSetEntityVars(63, { battery: 12 });
  // endpoint.onRunEntityFunction(30, 'teleportTo', [17, 21]);

  t.end();
});

