// Copyright IBM Corp. 2015,2016. All Rights Reserved.
// Node module: loopback-swagger
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

var typeConverter = module.exports = {

  /**
   * Convert a text value that can be expressed either as a string or
   * as an array of strings.
   * @param {string|Array} value
   * @returns {string}
   */
  convertText: function(value) {
    if (Array.isArray(value))
      return value.join('\n');
    return value;
  },
};
