function World() {
  this.entityDefs = {};
}

World.prototype.runAs = function(mode, opts) {
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
  for (var funcName in def.funcs) {
    (function(name, f) {
      entity[name] = function() {
        f.call(entity);
      };
    })(funcName, def.funcs[funcName]);
  }

  return entity;
};


function Entity() {
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

