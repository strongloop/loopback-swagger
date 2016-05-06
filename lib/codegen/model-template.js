// Copyright IBM Corp. 2015. All Rights Reserved.
// Node module: loopback-swagger
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

var fs = require('fs');
var path = require('path');

var template = fs.readFileSync(path.join(__dirname, 'model.ejs'), 'UTF-8');
module.exports = template;
