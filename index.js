var V2Generator = require('./lib/generator-v2');
var V12Generator = require('./lib/generator-v1.2.js');
var generateModels = require('./lib/json-schema');

function getGenerator(spec) {
  var generator;
  if (spec && spec.swagger === '2.0') {
    generator = new V2Generator();
  } else if (spec && spec.swaggerVersion === '1.2') {
    generator = new V12Generator();
  } else {
    throw new Error('Swagger spec version is not supported');
  }
  return generator;
}

/**
 * Generate remote methods from swagger spec
 * @param {Object} spec
 * @param {Object} options
 * @returns {String}
 */
exports.generateRemoteMethods = function(spec, options) {
  return getGenerator(spec).generateRemoteMethods(spec, options);
};

/**
 * Generate remote methods for an array of operations
 * @param {String|Number} version
 * @param {String} modelName
 * @param {BaseOperation[]} operations
 * @returns {String}
 */
exports.generateCode = function (version, modelName, operations) {
  var spec = {};
  if (version === '1.2') {
    spec.swaggerVersion = '1.2';
  } else {
    spec.swagger = '2.0';
  }
  return getGenerator(spec).generateCodeForOperations(modelName, operations);
};

/**
 * Generate model definitions
 * @param {Object} spec Swagger spec
 * @param {Object} options
 * @returns {Object}
 */
exports.generateModels = function (spec, options) {
  var models;
  if (spec && spec.swagger === '2.0') {
    models = spec.definitions;
  } else if (spec && spec.swaggerVersion === '1.2') {
    models = spec.models;
  } else {
    throw new Error('Swagger spec version is not supported');
  }
  return generateModels(models, options || {});
};

exports.getGenerator = getGenerator;

