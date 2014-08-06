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

  // Events that a user of NetworkEndpoint needs to call as they come in from
  // over the network.
  endpoint.onCreateEntity = function() {
    // TODO: create entity
  };
  endpoint.onDestroyEntity = function() {
    // TODO: destroy entity
  };
  endpoint.onUpdateEntityVars = function() {
    // TODO: update entity
  };
  endpoint.onRunEntityFunction = function() {
    // TODO: call entity func
  };

  // Stubs that a NetworkEndpoint implementation needs to set.
  endpoint.createEntity = function() {
  };
  endpoint.destroyEntity = function() {
  };
  endpoint.updateEntityVars = function() {
  };
  endpoint.runEntityFunction = function() {
  };

  return endpoint;
};


function Entity() {
}

function NetworkEndpoint() {
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

