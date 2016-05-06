// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: loopback-swagger
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

var V2Generator = require('./lib/codegen/generator-v2');
var V12Generator = require('./lib/codegen/generator-v1.2');
var generateModels = require('./lib/codegen/json-schema');
var generateSwaggerSpec = require('./lib/specgen/swagger-spec-generator');

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
exports.generateCode = function(version, modelName, operations) {
  var spec = {};
  if (version === '1.2') {
    spec.swaggerVersion = '1.2';
  } else {
    spec.swagger = 2;
  }
  return getGenerator(spec).generateCodeForOperations(modelName, operations);
};

/**
 * Generate model definitions
 * @param {Object} spec Swagger spec
 * @param {Object} options
 * @returns {Object}
 */
exports.generateModels = function(spec, options) {
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

exports.generateSwaggerSpec = generateSwaggerSpec;
