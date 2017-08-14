// Copyright IBM Corp. 2015. All Rights Reserved.
// Node module: loopback-swagger
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

var typeConverter = require('./type-converter');

exports.buildTagFromClass = function(sharedClass) {
  var modelSettings = sharedClass.ctor && sharedClass.ctor.settings;
  var sharedCtor = sharedClass.ctor && sharedClass.ctor.sharedCtor;
  var swaggerSettings = modelSettings && modelSettings.swagger || {};
  var name = swaggerSettings.tag && swaggerSettings.tag.name || sharedClass.name;

  var description = modelSettings && modelSettings.description ||
    sharedCtor && sharedCtor.description;

  var externalDocs = swaggerSettings.tag && swaggerSettings.tag.externalDocs;

  return {
    name: name,
    description: typeConverter.convertText(description),
    externalDocs: externalDocs,
  };
};
