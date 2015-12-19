'use strict';

var _ = require('lodash');

module.exports = TypeRegistry;

function TypeRegistry() {
  this._definitions = Object.create(null);
  this._referenced = Object.create(null);

  this.register('x-any', { properties: {} });
  this.register('ObjectID', { type: 'string', pattern: '^[a-fA-F\\d]{24}$' });
  this.register('GeoPoint', {
    properties: {
      lat: { type: 'number' },
      lng: { type: 'number' },
    },
  });
}

TypeRegistry.prototype.register = function(typeName, definitionOrFactoryFn) {
  if (typeof definitionOrFactoryFn === 'function') {
    this._definitions[typeName] = definitionOrFactoryFn;
  } else {
    this._definitions[typeName] = function() { return definitionOrFactoryFn; };
  }
};

TypeRegistry.prototype.reference = function(typeName) {
  this._referenced[typeName] = true;
  return '#/definitions/' + typeName;
};

TypeRegistry.prototype._buildDefinitionsFrom = function(definitionObj) {
  var defs = Object.create(null);
  var currentDefCount = 0;
  var newDefCount = 0;
  do {
    currentDefCount = Object.keys(definitionObj).length;
    for (var name in definitionObj) {
      if (!defs[name] && this._definitions[name]) {
        defs[name] = this._definitions[name]();
      }
    }
    newDefCount = Object.keys(definitionObj).length;
  } while (currentDefCount !== newDefCount);
  return defs;
}

TypeRegistry.prototype.getDefinitions = function() {
  var defs = this._buildDefinitionsFrom(this._referenced);

  for (var ref in this._referenced) {
    if (ref in defs) continue;
    // https://github.com/strongloop/loopback-explorer/issues/71
    console.warn('Swagger: skipping unknown type %j.', ref);
  }

  return defs;
};

TypeRegistry.prototype.getAllDefinitions = function() {
  return this._buildDefinitionsFrom(this._definitions);
};

TypeRegistry.prototype.isDefined = function(typeName) {
  return typeName in this._definitions;
};
