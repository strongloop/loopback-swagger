// Copyright IBM Corp. 2015,2016. All Rights Reserved.
// Node module: loopback-swagger
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

var _ = require('lodash');

module.exports = TypeRegistry;

function TypeRegistry() {
  this._definitions = Object.create(null);
  this._referenced = Object.create(null);
  this._loopbackTypeMap = Object.create(null);

  this.registerLoopbackType('x-any', { properties: {}});
  this.registerLoopbackType('ObjectID', { type: 'string', pattern: '^[a-fA-F\\d]{24}$' });
  this.registerLoopbackType('GeoPoint', {
    properties: {
      lat: { type: 'number' },
      lng: { type: 'number' },
    },
  });
}

TypeRegistry.prototype.registerLoopbackType = function(typeName, definition) {
  var typeNameLowerCase = typeName.toLowerCase();
  this._loopbackTypeMap[typeNameLowerCase] = typeName;
  this._definitions[typeNameLowerCase] = definition;
};

TypeRegistry.prototype.registerModel = function(typeName, definitionFn) {
  this._definitions[typeName] = definitionFn;
};

TypeRegistry.prototype.reference = function(typeName) {
  var refName = typeName;
  var typeNameLowerCase = typeName.toLowerCase();
  if (typeNameLowerCase in this._loopbackTypeMap) {
    refName = this._loopbackTypeMap[typeNameLowerCase];
  }
  this._referenced[refName] = true;
  return '#/definitions/' + refName;
};

TypeRegistry.prototype._buildDefinitionsFrom = function(definitionObj) {
  var defs = Object.create(null);
  var currentDefCount = 0;
  var newDefCount = 0;
  do {
    currentDefCount = Object.keys(definitionObj).length;
    for (var name in definitionObj) {
      var nameLowerCase = name.toLowerCase();
      if (nameLowerCase in this._loopbackTypeMap) {
        var loopbackTypeName = this._loopbackTypeMap[nameLowerCase];
        if (!defs[loopbackTypeName]) {
          defs[loopbackTypeName] = this._definitions[nameLowerCase];
        }
      } else {
        if (!defs[name] && this._definitions[name]) {
          defs[name] = this._definitions[name]();
        }
      }
    }
    newDefCount = Object.keys(definitionObj).length;
  } while (currentDefCount !== newDefCount);
  return defs;
};

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
  var typeNameLowerCase = typeName.toLowerCase();
  return typeName in this._definitions ||
    typeNameLowerCase in this._loopbackTypeMap;
};
