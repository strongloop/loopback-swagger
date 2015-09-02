/**
 * Build a LoopBack property definition from the JSON model
 * @param {Object} jsonModel The json model definition
 * @param {String} propertyName The property name
 * @returns {Object}
 */
function buildProperty(jsonModel, propertyName) {
  var jsonProperty = jsonModel.properties[propertyName];
  var property = {};
  var type = jsonProperty.$ref || jsonProperty.type;
  if (type === 'array' && jsonProperty.items) {
    type = [jsonProperty.items.$ref || jsonProperty.items.type];
  }
  if (type === 'integer') {
    type = 'number';
  }
  property.type = type;
  if (Array.isArray(jsonModel.required)
    && jsonModel.required.indexOf(propertyName) !== -1) {
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

function buildModel(models, jsonModel, modelName, anonymous) {
  if (models[modelName]) {
    return models[modelName];
  }
  var model = {name: modelName, properties: {}};
  var base;
  var prop;
  // Handle allOf
  if (Array.isArray(jsonModel.allOf)) {
    var refs = [];
    var required = [];
    for (var i = 0, n = jsonModel.allOf.length; i < n; i++) {
      var item = jsonModel.allOf[i];

      if (Array.isArray(item.required)) {
        required = required.concat(item.required);
      }
      var itemModel;
      if (item.$ref) {
        base = models[item.$ref] || base;
        refs.push(base);
      } else {
        // Build the embedded model
        itemModel = buildModel(models, item, modelName + '_' + i, true);
      }
      if (itemModel) {
        // Add more item model properties to the model
        for (prop in itemModel.properties) {
          model.properties[prop] = itemModel.properties[prop];
        }
      }
    }
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
  for (var p in jsonModel.properties) {
    var property = buildProperty(jsonModel, p);
    model.properties[p] = property;
  }
  if(!anonymous) {
    models[modelName] = model;
  }
  return model;
}

/**
 * Convert the JSON-schema to LoopBack model definitions
 * @param {Object} schema
 */
module.exports = function (schema) {
  var models = {};
  if (!schema) {
    return models;
  }
  for (var m in schema) {
    var jsonModel = schema[m];
    buildModel(models, jsonModel, m);
  }
  return models;
}
