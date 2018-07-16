// Copyright IBM Corp. 2015,2016. All Rights Reserved.
// Node module: loopback-swagger
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

/**
 * Module dependencies.
 */
var schemaBuilder = require('./schema-builder');
var typeConverter = require('./type-converter');
var TypeRegistry = require('./type-registry');
var _ = require('lodash');

/**
 * Export the modelHelper singleton.
 */
var modelHelper = module.exports = {
  /**
   * Given a class (from remotes.classes()), generate a model definition.
   * This is used to generate the schema at the top of many endpoints.
   * @param  {Class} modelClass Model class.
   * @param {TypeRegistry} typeRegistry Registry of types and models.
   * @return {Object} Associated model definition.
   */
  registerModelDefinition: function(modelCtor, typeRegistry, opts) {
    var lbdef = modelCtor.definition;

    if (!lbdef) {
      // The model does not have any definition, it was most likely
      // created as a placeholder for an unknown property type
      return;
    }

    var name = lbdef.name;
    if (typeRegistry.isDefined(name)) {
      // The model is already included
      return;
    }

    typeRegistry.registerModel(name, function() {
      return definitionFunction(modelCtor, typeRegistry);
    });

    // check if ModelClass has defined getUpdateOnlyProperties() function to
    // avoid version issues
    if (opts && opts.generateOperationScopedModels && modelCtor.getUpdateOnlyProperties) {
      const excludeProps = modelCtor.getUpdateOnlyProperties();
      // if at least one excludeProp is found, we need to create another model
      // to be used only for create operation and this model will not have
      // excludeProp included in the model. e.g generated "id" property
      if (excludeProps && excludeProps.length > 0) {
        const modelName = '$new_' + name;
        typeRegistry.registerModel(modelName, function() {
          return definitionFunction(modelCtor, typeRegistry, {excludeProps});
        });
      }
    }
  },

  isHiddenProperty: function(definition, propName) {
    return definition.settings &&
      Array.isArray(definition.settings.hidden) &&
      definition.settings.hidden.indexOf(propName) !== -1;
  },
};

var definitionFunction = function(modelCtor, typeRegistry, options) {
  var lbdef = modelCtor.definition;

  var swaggerDef = {
    description: typeConverter.convertText(
      lbdef.description || (lbdef.settings && lbdef.settings.description)
    ),
    properties: {},
    required: [],
  };

  if (lbdef.settings && lbdef.settings.swagger && lbdef.settings.swagger.example) {
    swaggerDef.example = lbdef.settings.swagger.example;
  }

  addSwaggerExtensions(lbdef.settings);

  var properties = lbdef.rawProperties || lbdef.properties;

  // Iterate through each property in the model definition.
  // Types may be defined as constructors (e.g. String, Date, etc.),
  // or as strings; swaggerSchema.buildFromLoopBackType() will take
  // care of the conversion.
  Object.keys(properties).forEach(function(key) {
    var prop = properties[key];

    // Hide hidden properties.
    if (modelHelper.isHiddenProperty(lbdef, key))
      return;

    // Get a type out of the constructors we were passed.
    var schema = schemaBuilder.buildFromLoopBackType(prop, typeRegistry);

    var desc = typeConverter.convertText(prop.description || prop.doc);
    if (desc) schema.description = desc;

    // Required props sit in a per-model array.
    if (prop.required || (prop.id && !prop.generated)) {
      swaggerDef.required.push(key);
    }

    // if model has excludeProps properties, skip adding to the model since this
    // model is used for create operation only where this property
    // should not exist
    if (options && options.excludeProps && _.includes(options.excludeProps, key)) {
      return;
    }
    swaggerDef.properties[key] = schema;
  });

  if (lbdef.settings) {
    var strict = lbdef.settings.strict;
    var additionalProperties = lbdef.settings.additionalProperties;
    var notAllowAdditionalProperties = strict || (additionalProperties !== true);
    if (notAllowAdditionalProperties) {
      swaggerDef.additionalProperties = false;
    }
  }

  if (!swaggerDef.required.length) {
    // "required" must have at least one item when present
    delete swaggerDef.required;
  }

  // Add models from settings
  if (lbdef.settings && lbdef.settings.models) {
    for (var m in lbdef.settings.models) {
      var model = modelCtor[m];
      if (typeof model !== 'function' || !model.modelName) continue;
      modelHelper.registerModelDefinition(model, typeRegistry);
      typeRegistry.reference(model.modelName);
    }
  }

  // Generate model definitions for related models
  /* eslint-disable one-var */
  for (var r in modelCtor.relations) {
    var rel = modelCtor.relations[r];
    if (rel.modelTo) {
      modelHelper.registerModelDefinition(rel.modelTo, typeRegistry);
    }
    if (rel.modelThrough) {
      modelHelper.registerModelDefinition(rel.modelThrough, typeRegistry);
    }
  }
  /* eslint-enable one-var */
  return swaggerDef;

  function addSwaggerExtensions(defs) {
    for (var def in defs) {
      if (def.match(/^x\-/)) {
        swaggerDef[def] = defs[def];
      }
    }
  };
};

