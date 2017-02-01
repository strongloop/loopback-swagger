// Copyright IBM Corp. 2015,2016. All Rights Reserved.
// Node module: loopback-swagger
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

function resolveTypeRef(schema, ref) {
  if (typeof ref === 'string') {
    if (ref.indexOf('#/definitions/') === 0) {
      ref = ref.substring('#/definitions/'.length);
    }
    var model = schema[ref];
    if (model) {
      if (model.type === 'object' || !model.type) {
        return ref;
      }
      if (model.type === 'array') {
        var itemType = model.items.type;
        if (model.items.$ref) {
          itemType = resolveTypeRef(schema, model.items.$ref);
        }
        return [itemType];
      } else {
        return model.type;
      }
    }
  }
  return ref;
}

/**
 * Build a LoopBack property definition from the JSON model
 * @param {Object} schema JSON Schema
 * @param {Object} jsonModel The json model definition
 * @param {String} propertyName The property name
 * @returns {Object}
 */
function buildProperty(schema, jsonModel, propertyName) {
  var jsonProperty = jsonModel.properties[propertyName];
  var property = {};

  var type = jsonProperty.type;
  if (jsonProperty.$ref) {
    type = resolveTypeRef(schema, jsonProperty.$ref);
  }

  if (type === 'array' && jsonProperty.items) {
    var itemType = jsonProperty.items.type;
    if (jsonProperty.items.$ref) {
      itemType = resolveTypeRef(schema, jsonProperty.items.$ref);
    }
    type = [itemType];
  }
  if (type === 'integer') {
    type = 'number';
  }
  property.type = type;
  if (Array.isArray(jsonModel.required) &&
    jsonModel.required.indexOf(propertyName) !== -1) {
    property.required = true;
  }
  for (var a in jsonProperty) {
    if (a === '$ref' || a === 'items' || (a in property)) {
      continue;
    }
    property[a] = jsonProperty[a];
  }
  return property;
}

function buildModel(models, schema, jsonModel, modelName, anonymous) {
  if (models[modelName]) {
    return models[modelName];
  }
  if (jsonModel.type && jsonModel.type !== 'object') {
    // The model is either an array or primitive type
    return;
  }
  var model = {name: modelName, properties: {}};
  var base, prop;
  // Handle allOf
  if (Array.isArray(jsonModel.allOf)) {
    var refs = [];
    var required = [];
    /* eslint-disable one-var */
    for (var i = 0, n = jsonModel.allOf.length; i < n; i++) {
      var item = jsonModel.allOf[i];

      if (Array.isArray(item.required)) {
        required = required.concat(item.required);
      }
      var itemModel;
      if (item.$ref) {
        // Extract model name from reference object
        base = models[item.$ref.substring('#/definitions/'.length)] || base;
        refs.push(base);
      } else {
        // Build the embedded model
        itemModel = buildModel(models, schema, item, modelName + '_' + i, true);
      }
      if (itemModel) {
        // Add more item model properties to the model
        for (prop in itemModel.properties) {
          model.properties[prop] = itemModel.properties[prop];
        }
      }
    }
    /* eslint-enable one-var */
    if (refs.length === 1) {
      // Set the referenced model as the base
      model.base = (base && base.name) || base;
    } else {
      // Mix in all properties from the referenced models
      for (i = 0, n = refs.length; i < n; i++) {
        // Add more item model properties to the model
        for (prop in refs[i].properties) {
          model.properties[prop] = refs[i].properties[prop];
        }
      }
    }
    for (prop in model.properties) {
      if (required.indexOf(prop) !== -1) {
        model.properties[prop].required = true;
      }
    }
  }
  if (jsonModel['x-base-type']) {
    model.base = jsonModel['x-base-type'];
  }
  /* eslint-disable one-var */
  for (var p in jsonModel.properties) {
    var property = buildProperty(schema, jsonModel, p);
    model.properties[p] = property;
  }

  if (typeof jsonModel['x-relations'] === 'object') {
    model.relations = {};
    for (var r in jsonModel['x-relations']) {
      var rel = jsonModel['x-relations'][r];
      if (rel.partner && rel.partner.$ref) {
        rel.model = resolveTypeRef(schema, rel.partner.$ref);
        delete rel.partner;
      }
      model.relations[r] = rel;
    }
  }

  /* eslint-enable one-var */
  if (!anonymous) {
    models[modelName] = model;
  }
  return model;
}

/**
 * Convert the JSON-schema to LoopBack model definitions
 * @param {Object} schema
 */
module.exports = function(schema) {
  var models = {};
  if (!schema) {
    return models;
  }
  for (var m in schema) {
    var jsonModel = schema[m];
    buildModel(models, schema, jsonModel, m);
  }
  return models;
};
