var util = require('util');
var V2Generator = require('../lib/generator-v2');
var V12Generator = require('../lib/generator-v1.2.js');

function generate(spec, options) {
  var generator;
  if (spec && spec.swagger === 2) {
    generator = new V2Generator();
  } else if (spec && spec.swaggerVersion === '1.2') {
    generator = new V12Generator();
  } else {
    throw new Error('Swagger spec version is not supported');
  }
  return generator.generateRemoteMethods(spec, options);
}

module.exports = generate;

var petStoreV2Spec = require('./pet-store-2.0.json');
var code = generate(petStoreV2Spec, {modelName: 'Store'});
console.log(code);

var petStoreV12Spec = require('./pet-store-1.2.json');
code = generate(petStoreV12Spec);
console.log(code);

var modelGenerate = require('../lib/json-schema');

console.log('\nModels v2 -------------\n');
var models = modelGenerate(petStoreV2Spec.definitions);
console.log(util.inspect(models, {depth: null }));

console.log('\nModels v1.2 -------------\n');
models = modelGenerate(petStoreV12Spec.models);
console.log(util.inspect(models, {depth: null }));