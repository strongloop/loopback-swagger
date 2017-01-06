// Copyright IBM Corp. 2015,2016. All Rights Reserved.
// Node module: loopback-swagger
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

var tagBuilder = require('../../lib/specgen/tag-builder');
var expect = require('chai').expect;
var _defaults = require('lodash').defaults;

describe('tag-builder', function() {
  it('joins array descriptions from ctor.settings', function() {
    var tag = tagBuilder.buildTagFromClass({
      ctor: {settings: {description: ['line1', 'line2']}},
    });

    expect(tag.description).to.equal('line1\nline2');
  });

  it('joins array descriptions from ctor.sharedCtor', function() {
    var tag = tagBuilder.buildTagFromClass({
      ctor: {sharedCtor: {description: ['1', '2', '3']}},
    });

    expect(tag.description).to.eql('1\n2\n3');
  });
});
