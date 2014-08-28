var V2Generator = require('./lib/generator-v2');
var V12Generator = require('./lib/generator-v1.2.js');
var generateModels = require('./lib/json-schema');

function getGenerator(spec) {
  var generator;
  if (spec && spec.swagger === 2) {
    generator = new V2Generator();
  } else if (spec && spec.swaggerVersion === '1.2') {
    generator = new V12Generator();
  } else {
    throw new Error('Swagger spec version is not supported');
  }
  return generator;
}

exports.generateRemoteMethods = function(spec, options) {
  return getGenerator(spec).generateRemoteMethods(spec, options);
};

exports.generateModels = function (spec, options) {
  var models;
  if (spec && spec.swagger === 2) {
    models = spec.definitions;
  } else if (spec && spec.swaggerVersion === '1.2') {
    models = spec.models;
  } else {
    throw new Error('Swagger spec version is not supported');
  }
  return generateModels(models, options || {});
};

exports.getGenerator = getGenerator;

