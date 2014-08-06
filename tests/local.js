var repl = require('../index');
var test = require('tape');

function localStockWorld() {
  var world = new repl.World();

  // NEEDS:
  //  A way of creating client endpoints
  //
  world.runAs(repl.NetworkMode.Standalone, {
  // Only needed in Client or Server modes
   // host: 'foo.example.org',
   // port: 8000,
  });

  world.defineEntity("point-mass", {
    vars: {
      x: 0,
      y: 0,
      mass: 1,
    },

    funcs: {
      teleportFixed: function() {
        this.x = 50;
        this.y = 60;
      },

      teleportTo: function(toX, toY) {
        this.x = toX;
        this.y = toY;
      },
    },

    replication: function(vars) {
      if (this.role === repl.Role.Authority) {
        vars.push('x', 'y', 'mass');
      }
    },
  });

  return world;
}

test('unknown entity def', function(t) {
  var world = localStockWorld();

  var car = world.createEntity("car");
  t.equal(car, null);

  t.end();
});

test('create local entity', function(t) {
  var world = localStockWorld();

  var pmass = world.createEntity("point-mass");
  t.equal(pmass.type, "point-mass");
  t.equal(pmass.mass, 1);
  t.equal(pmass.x, 0);

  pmass.x = 17;
  t.equal(pmass.mass, 1);
  t.equal(pmass.x, 17);

  t.end();

  // Q: how do I set up a server and hook it up to the world?
  // Q: how do ReplicationChannels get set up?
});

test('local entity function; no args', function(t) {
  var world = localStockWorld();

  var pmass = world.createEntity("point-mass");
  t.equal(pmass.x, 0);
  t.equal(pmass.y, 0);

  pmass.teleportFixed();

  t.equal(pmass.x, 50);
  t.equal(pmass.y, 60);

  t.end();
});

test('local entity function; with args', function(t) {
  var world = localStockWorld();

  var pmass = world.createEntity("point-mass");
  t.equal(pmass.x, 0);
  t.equal(pmass.y, 0);

  pmass.teleportTo(97, -18);

  t.equal(pmass.x, 97);
  t.equal(pmass.y, -18);

  t.end();
});

test('local role', function(t) {
  var world = localStockWorld();

  var pmass = world.createEntity("point-mass");
  t.equal(pmass.role, repl.Role.Authority);
  t.equal(pmass.remoteRole, repl.Role.None);

  t.end();
});

