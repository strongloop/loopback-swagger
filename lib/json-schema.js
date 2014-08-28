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
    var model = {name: m, properties: {}};
    for (var p in jsonModel.properties) {
      var jsonProperty = jsonModel.properties[p];
      var property = {};
      var type = jsonProperty.$ref || jsonProperty.type;
      if (type === 'array' && jsonProperty.items) {
        type = [jsonProperty.items.$ref || jsonProperty.items.type];
      }
      if (type === 'integer') {
        type = 'number';
      }
      property.type = type;
      for (var a in jsonProperty) {
        if (a === '$ref' || (a in property)) {
          continue;
        }
        property[a] = jsonProperty[a];
      }
      model.properties[p] = property;
    }
    models[m] = model;
  }
  return models;
}
