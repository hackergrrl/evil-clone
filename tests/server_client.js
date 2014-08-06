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

// Hook up server and client endpoints to talk directly to each other.
function hookupServerClient(server, client) {
  var serverEndpoint = server.createNetworkEndpoint();
  var clientEndpoint = client.createNetworkEndpoint();

  serverEndpoint.createEntity = function(entityId) {
    clientEndpoint.onCreateEntity(entityId);
  };
  serverEndpoint.destroyEntity = function(entityId) {
    clientEndpoint.onDestroyEntity(entityId);
  };
  serverEndpoint.setEntityVars = function(entityId, vars) {
    clientEndpoint.onUpdateEntityVars(entityId, vars);
  };
  serverEndpoint.runEntityFunction = function(entityId, funcName, args) {
    clientEndpoint.onRunEntityFunction(entityId, funcName, args);
  };

  clientEndpoint.createEntity = function(entityId) {
    serverEndpoint.onCreateEntity(entityId);
  };
  clientEndpoint.destroyEntity = function(entityId) {
    serverEndpoint.onDestroyEntity(entityId);
  };
  clientEndpoint.setEntityVars = function(entityId, vars) {
    serverEndpoint.onUpdateEntityVars(entityId, vars);
  };
  clientEndpoint.runEntityFunction = function(entityId, funcName, args) {
    serverEndpoint.onRunEntityFunction(entityId, funcName, args);
  };

  return [serverEndpoint, clientEndpoint];
}

function stockWorld() {
  var world = new repl.World();

  world.defineEntity("point-mass", {
    vars: {
      remoteRole: repl.Role.DumbProxy,
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


// NetworkEndpoint
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

  t.end();
});

test('server/client world', function(t) {
  var clientWorld = clientStockWorld();
  var serverWorld = serverStockWorld();

  hookupServerClient(serverWorld, clientWorld);

  t.ok('worked');

  t.end();
});


// Creation replication
test('server entity replication', function(t) {
  t.plan(1);

  var clientWorld = clientStockWorld();
  var serverWorld = serverStockWorld();

  var endpoints = hookupServerClient(serverWorld, clientWorld);
  var serverEndpoint = endpoints[0];
  var clientEndpoint = endpoints[1];

  clientEndpoint.createEntity = function(entityId) {
    t.ok('entity created');
  };

  var serverEntity = serverWorld.createEntity("point-mass");

  // TODO(noffle): this is a private function that real code shouldn't use
  serverWorld.tick();

  t.end();
});





// Replication tests:
//   entity creation
//     server => client entity creation (both already active)
//     server => client entity creation (client joins AFTER creation)
//     server creates entity /w no remoteRole; client sees nothing
//     client creates entity /w a remoteRole; doesn't goto server
//   entity destruction
//   setting vars
//     ...
//   calling funcs
//     ...
