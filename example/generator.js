// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: loopback-swagger
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

var util = require('util');
var helper = require('../index');

var petStoreV2Spec = require('./pet-store-2.0.json');
var code = helper.generateRemoteMethods(petStoreV2Spec, { modelName: 'Store' });
console.log(code);

var petStoreV12Spec = require('./pet-store-1.2.json');
code = helper.generateRemoteMethods(petStoreV12Spec);
console.log(code);

console.log('\nModels v2 -------------\n');
var models = helper.generateModels(petStoreV2Spec);
console.log(util.inspect(models, { depth: null }));

console.log('\nModels v1.2 -------------\n');
models = helper.generateModels(petStoreV12Spec);
console.log(util.inspect(models, { depth: null }));
