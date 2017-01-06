// Copyright IBM Corp. 2015,2016. All Rights Reserved.
// Node module: loopback-swagger
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

var _ = require('lodash');
var url = require('url');

function assign(target, targetProperty, source, sourceProperty, defaultValue) {
  if (source && source[sourceProperty]) {
    target[targetProperty] = source[sourceProperty] || defaultValue;
  } else if (defaultValue) {
    target[targetProperty] = defaultValue;
  }
}

var primitiveTypes = ['integer', 'number', 'string', 'boolean', 'File'];

module.exports.sourceVersion = 'Swagger 1.2';

module.exports.applies = function(data) {
  return (data.swaggerVersion && data.swaggerVersion === '1.2');
};

function convertApi(v2, apiDeclaration, definitions) {
  if (v2.info.version == null) {
    v2.info.version = apiDeclaration.apiVersion;
  }

  if (v2.host === 'unknown' || v2.basePath === 'unknown') {
    var base = url.parse(apiDeclaration.basePath);
    v2.host = base.host;
    v2.basePath = base.pathname;

    // This assumes that the the schemes in the apiDeclaration basePath are the only ones supported.
    //
    if (!_.contains(v2.schemes, base.scheme)) {
      v2.schemes.push(base.protocol.replace(':', ''));
    }
  }

  var resourceProduces = apiDeclaration.produces;
  var resourceConsumes = apiDeclaration.consumes;

  // What to do with authorizations -> security?
  // Assuming security is an array of permissions/oauth scopes
  //
  // Pull apiDeclaration level security down to operations
  //
  var resourceSecurity = null;

  if (apiDeclaration.authorizations &&
    apiDeclaration.authorizations.oauth &&
    apiDeclaration.authorizations.oauth.scopes) {
    resourceSecurity = _.map(apiDeclaration.authorizations.oauth.scopes, function(scope) {
      return scope.scope;
    });
  }

  _.each(apiDeclaration.apis, function(api) {
    var path = v2.paths[api.path] = {};

    _.each(api.operations, function(operation) {
      var method = {};

      assign(method, 'summary', operation, 'summary');
      assign(method, 'description', operation, 'notes');
      assign(method, 'operationId', operation, 'nickname');

      if (resourceProduces) {
        method.produces = resourceProduces;
      }

      assign(method, 'produces', operation, 'produces');

      if (resourceConsumes) {
        method.consumes = resourceConsumes;
      }

      assign(method, 'consumes', operation, 'consumes');

      if (operation.parameters && operation.parameters.length > 0) {
        method.parameters = _.map(operation.parameters, function(parameter) {
          var converted = {
            name: parameter.name,
            in: parameter.paramType === 'form' ? 'formData' : parameter.paramType,
          };

          if (parameter.description) {
            // TODO: [rfeng] Convert html to md
            // converted.description = md(parameter.description);
            converted.description = parameter.description;
          }

          converted.required = parameter.paramType === 'body' ? true : parameter.required;
          assign(converted, 'uniqueItems', parameter, 'uniqueItems');

          var target = converted;
          var props = {};

          if (parameter.paramType === 'body' && parameter.type === 'array') {
            // This would not validate through the schema.  Issue?
            //
            // props.type = "array";
            // props.items = {
            props.schema = {
              '$ref': '#/definitions/' + parameter.items['$ref'],
            };
          } else if (_.contains(primitiveTypes, parameter.type)) {
            props.type = parameter.type;

            if (parameter.format) {
              props.format = parameter.format;
            }
          } else {
            props.schema = {
              '$ref': '#/definitions/' + parameter.type,
            };
          }
          /*
           // Do not apply to parameters.  It seems to be in 1.2 by way of dataTypeBase.json.  Issue?
           // Commented out to pass validation.
           //
           assign(props, 'default', parameter, 'defaultValue');
           assign(props, 'enum', parameter, 'enum');

           if (parameter.type === "integer") {
           if (parameter.minimum) props.minimum = parseInt(parameter.minimum);
           if (parameter.maximum) props.maximum = parseInt(parameter.maximum);
           } else if (parameter.type === "number") {
           if (parameter.minimum) props.minimum = parseFloat(parameter.minimum);
           if (parameter.maximum) props.maximum = parseFloat(parameter.maximum);
           }
           */

          if (parameter.allowMultiple) {
            target.type = 'array';
            target.items = props;
          } else {
            _.extend(target, props);
          }
          // Files hasn't made it over yet.
          //
          if (target.type === 'File') {
            target.type = 'string';
          }

          assign(converted, 'x-typeArguments', parameter, 'typeArguments');

          return converted;
        });
      }

      var responses = {};

      if (
        operation.type &&

        operation.type !== 'void') {
        var items = {};
        var response = {
          description: 'Success',
          schema: {},
        };

        if (operation.type === 'array') {
          response.schema.type =
            'array';
          response.schema.items = {
            '$ref': '#/definitions/' + operation.items['$ref'],
          };
        } else if (_.contains(primitiveTypes, operation.type)) {
          response.schema.type = operation.type;

          if (operation.format) {
            response.schema.format = operation.format;
          }
        } else {
          response.schema['$ref'] = '#/definitions/' + operation.type;
        }
        responses['200'] = response;
      }

      if (operation.responseMessages) {
        _.each(operation.responseMessages, function(response) {
          responses[response.code] = {
            description: response.message,
          };
        });
      }
      if (_.isEmpty(responses)) {
        responses['200'] = {description: 'Success'};
      }

      method.responses = responses;

      if (resourceSecurity) {
        method.security = resourceSecurity;
      }

      // TODO schemes
      // What to do with authorizations -> security?
      // Assuming security is an array of permissions/oauth scopes
      //
      if (operation.authorizations && operation.authorizations.oauth &&
        operation.authorizations.oauth.scopes) {
        method.security = _.map(operation.authorizations.oauth.scopes,
          function(scope) {
            return scope.scope;
          });
      }

      path[operation.method.toLowerCase()] = method;
    });
  });

  _.each(apiDeclaration.models, function(model, name) {
    var definition = {};

    assign(definition, 'required', model, 'required');
    definition.properties = {};
    _.each(model.properties, function(property, name) {
      var converted = _.clone(property);

      assign(converted, 'type', property, 'type');
      assign(converted, 'schema', property, 'schema');
      assign(converted, 'items', property, 'items');
      assign(converted, 'default', property, 'defaultValue');
      assign(converted, 'enum', property, 'enum');

      if (property.type === 'integer') {
        if (property.minimum) {
          converted.minimum = parseInt(property.minimum);
        }
        if (property.maximum) {
          converted.maximum = parseInt(property.maximum);
        }
      } else if (converted.type === 'number') {
        if (property.minimum) {
          converted.minimum = parseFloat(property.minimum);
        }
        if (property.maximum) {
          converted.maximum = parseFloat(property.maximum);
        }
      }

      definition.properties[name] = converted;
    });

    // TODO
    // subTypes
    // discriminator
    //

    assign(definition, 'x-typeParameters', model, 'typeParameters');

    definitions[name] = definition;
  });
}

module.exports.convert = function(specUrl, resourceListing, apiDeclarations) {
  var v2 = {
    swagger: '2.0',
  };

  if (resourceListing.info) {
    v2.info = {};
    v2.info.title = resourceListing.info.title;
    v2.info.version = resourceListing.apiVersion;
    v2.info.description = resourceListing.info.description;
    // v2.info.description = md(resourceListing.info.description);
    assign(v2.info, 'termsOfService', resourceListing.info, 'termsOfServiceUrl');

    if (resourceListing.info.contact) {
      v2.info.contact = {name: resourceListing.info.contact};
    }

    if (resourceListing.info.license) {
      v2.info.license = v2.info.license || {};
      v2.info.license.name = resourceListing.info.license;
    }

    if (resourceListing.info.licenseUrl) {
      v2.info.license = v2.info.license || {};
      v2.info.license.url = resourceListing.info.licenseUrl;
    }

    // TODO authorizations?
  }

  v2.host = 'unknown';
  v2.basePath = 'unknown';
  v2.schemes = [];

  v2['x-resources'] = resourceListing.apis;
  v2.paths = {};

  var definitions = {};

  _.each(apiDeclarations, function(apiDeclaration) {
    convertApi(v2, apiDeclaration, definitions);
  });
};
