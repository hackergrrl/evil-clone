function World() {
  this.entityDefs = {};
}

World.prototype.runAs = function(mode, opts) {
  this.networkMode = mode;
};

World.prototype.defineEntity = function(name, opts) {
  this.entityDefs[name] = opts;
};

// Create a new entity that is local to THIS machine.
World.prototype.createEntity = function(name) {
  var def = this.entityDefs[name];
  if (def === null || def === undefined) {
    return null;
  }

  var entity = new Entity();
  entity.type = name;

  // Local entities are always Authority.
  entity.role = Role.Authority;

  // We rely on whoever writes the entity def to set a remoteRole if they don't
  // want the default of None (no replication).
  entity.remoteRole = Role.None;

  // Populate vars.
  for (var varName in def.vars) {
    entity[varName] = def.vars[varName];
  }

  // Populate funcs.
  var world = this;
  for (var funcName in def.funcs) {
    (function(name, params) {
      var server = (params[0] === "server");
      var client = (params[0] === "client");
      var multicast = (params[0] === "multicast");
      var simulated = (params[0] === "simulated");
      var f = params[1];
      entity[name] = function() {
        // if (server && world.networkMode === NetworkMode.Client) {
        //   // TODO: replicate call to server
        //   return;
        // }
        // if (client && world.networkMode !== NetworkMode.Client) {
        //   // TODO: replicate call to owning client
        //   return;
        // }
        f.apply(entity, arguments);
      };
    })(funcName, def.funcs[funcName]);
  }

  return entity;
};

World.prototype.createNetworkEndpoint = function() {
  var endpoint = new NetworkEndpoint();

  return endpoint;
};

// Perform a network tick.
//  1. flush all var updates down all entities' ReplicationChannels
//  2. ???
//  3. ???
World.prototype.tick = function() {
};


function Entity() {
  this.replicationChannels = [];
}

function NetworkEndpoint() {
}

// Events that a user of NetworkEndpoint needs to call as they come in from
// over the network.
NetworkEndpoint.prototype.onCreateEntity = function() {
  // TODO: create entity
  console.log('TODO: create entity');
};
NetworkEndpoint.prototype.onDestroyEntity = function() {
  // TODO: destroy entity
  console.log('TODO: destroy entity');
};
NetworkEndpoint.prototype.onUpdateEntityVars = function() {
  // TODO: update entity
  console.log('TODO: update entity');
};
NetworkEndpoint.prototype.onRunEntityFunction = function() {
  // TODO: call entity func
  console.log('TODO: call func on entity');
};

// Stubs that a NetworkEndpoint implementation needs to set.
NetworkEndpoint.prototype.createEntity = function() {};
NetworkEndpoint.prototype.destroyEntity = function() {};
NetworkEndpoint.prototype.updateEntityVars = function() {};
NetworkEndpoint.prototype.runEntityFunction = function() {};


function ReplicationChannel() {
  this.networkEndpoint = null;
  this.entity = null;
  this.varSnapshot = {};
}


var NetworkMode = {
  Local: 0,
  Server: 1,
  Client: 2,
};

var Role = {
  Authority: 10,
  AutonomousProxy: 8,
  SimulatedProxy: 6,
  DumbProxy: 4,
  None: 2,
};


module.exports.NetworkMode = NetworkMode;
module.exports.Role = Role;
module.exports.World = World;

