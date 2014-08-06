function World() {
  this.entityDefs = {};
  this.networkEndpoints = [];
  this.entities = {};
}

World.prototype.runAs = function(mode, opts) {
  this.networkMode = mode;
};

World.prototype.defineEntity = function(name, opts) {
  this.entityDefs[name] = opts;
};

(function() {
  var currentId = 0;
  World.prototype.generateId = function() {
    var id = ++currentId;

    // Wholly client-side IDs are always negative, to avoid conflict.
    if (this.networkMode === NetworkMode.Client) {
      id = -id;
    }

    return id;
  }
})();

// Create a new entity that is local to THIS machine.
World.prototype.createEntity = function(name, id) {
  var def = this.entityDefs[name];
  if (def === null || def === undefined) {
    return null;
  }

  var entity = new Entity();
  entity.type = name;

  // Assign an ID, if one is not given.
  if (id != undefined) {
    entity.id = id;
  } else {
    entity.id = this.generateId();
  }
  this.entities[entity.id] = entity;

  // List of (live) replication channels.
  entity.channels = [];

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
  var endpoint = new NetworkEndpoint(this);

  this.networkEndpoints.push(endpoint);

  return endpoint;
};

// Perform a network tick.
//  1. flush all var updates down all entities' ReplicationChannels
//  2. ???
//  3. ???
//  TODO: one day, this'll detect all entities that are relevant to each player
//  but are NOT currently being tracked, and create replication channels for
//  them.
World.prototype.tick = function() {
  // Tick all replication channels of all entities.
  for (var id in this.entities) {
    var entity = this.entities[id];
    for (var i in entity.channels) {
      entity.channels[i].tick();
    }
  }
};


function Entity() {
  this.replicationChannels = [];
}

function NetworkEndpoint(world) {
  this.world = world;
}

// Events that a user of NetworkEndpoint needs to call as they come in from
// over the network.
NetworkEndpoint.prototype.onCreateEntity = function(entityId, defName) {
  var entity = world.createEntity(defName, entityId);

  // TODO: once there's a notion of 'relevancy', the below should simply happen
  // automatically in tick, as the world realizes that there are entities that
  // are relevant to a player that aren't being replicated.
  // TODO: only create a replication channel if it makes sense (e.g. not if
  // Role.None is involved)
  for (var i in this.world.networkEndpoints) {
    var endpoint = this.world.networkEndpoints[i];
    var channel = new ReplicationChannel(entity, endpoint);
    entity.channels.push(channel);
  }
};
NetworkEndpoint.prototype.onDestroyEntity = function(entityId) {
  // TODO: destroy entity
  console.log('TODO: destroy entity');
};
NetworkEndpoint.prototype.onUpdateEntityVars = function(entityId, vars) {
  // TODO: update entity
  console.log('TODO: update entity');
};
NetworkEndpoint.prototype.onRunEntityFunction = function(entityId, funcName, args) {
  // TODO: call entity func
  console.log('TODO: call func on entity');
};

// Stubs that a NetworkEndpoint implementation needs to set.
NetworkEndpoint.prototype.createEntity = function() {};
NetworkEndpoint.prototype.destroyEntity = function() {};
NetworkEndpoint.prototype.updateEntityVars = function() {};
NetworkEndpoint.prototype.runEntityFunction = function() {};


function ReplicationChannel(entity, endpoint) {
  this.networkEndpoint = endpoint;
  this.entity = entity;
  this.varSnapshot = {};
  this._knownToEndpoint = false;
}

ReplicationChannel.prototype.tick = function() {
  // Flush entity creation if unknown.
  console.log('hi');
  if (!this._knownToEndpoint) {
    this.networkEndpoint.createEntity(this.entity.id, this.entity.type);
    this._knownToEndpoint = true;
  }
};


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

