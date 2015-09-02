'use strict';

var url = require('url');
var loopback = require('loopback');
var createSwaggerObject = require('../..').generateSwaggerSpec;

var expect = require('chai').expect;

describe('swagger definition', function() {
  describe('defaults', function() {
    var swaggerResource;
    before(function() {
      var app = createLoopbackAppWithModel();
      swaggerResource = createSwaggerObject(app);
    });

    it('advertises Swagger Spec version 2.0', function() {
      expect(swaggerResource).to.have.property('swagger', '2.0');
    });

    it('has "basePath" set to "/api"', function() {
      expect(swaggerResource).to.have.property('basePath', '/api');
    });

    it('uses the "host" serving the documentation', function() {
      // see swagger-spec/2.0.md#fixed-fields
      // If the host is not included, the host serving the documentation is to
      // be used (including the port).
      expect(swaggerResource).to.have.property('host', undefined);
    });

    it('uses the "schemes" serving the documentation', function() {
      // see swagger-spec/2.0.md#fixed-fields
      // If the schemes is not included, the default scheme to be used is the
      // one used to access the Swagger definition itself.
      expect(swaggerResource).to.have.property('schemes', undefined);
    });

    it('provides info.title', function() {
      expect(swaggerResource.info)
        .to.have.property('title', 'loopback-swagger');
    });
  });

  describe('basePath', function() {
    it('is "{basePath}" when basePath is a path', function() {
      var app = createLoopbackAppWithModel();
      var swaggerResource = createSwaggerObject(app, {
        basePath: '/api-root'
      });

      expect(swaggerResource.basePath).to.equal('/api-root');
    });

    it('is inferred from app.get("apiRoot")', function() {
      var app = createLoopbackAppWithModel();
      app.set('restApiRoot', '/custom-api-root');
      var swaggerResource = createSwaggerObject(app);
      expect(swaggerResource.basePath).to.equal('/custom-api-root');
    });

    it('respects a hardcoded protocol (behind SSL terminator)', function() {
      var app = createLoopbackAppWithModel();
      var swaggerResource = createSwaggerObject(app, {
        protocol: 'https'
      });
      expect(swaggerResource.schemes).to.eql(['https']);
    });

    it('supports opts.host', function() {
      var app = createLoopbackAppWithModel();
      var swaggerResource = createSwaggerObject(app, {
        host: 'example.com:8080'
      });
      expect(swaggerResource.host).to.equal('example.com:8080');
    });
  });

  it('has global "consumes"', function() {
    var app = createLoopbackAppWithModel();
    var swaggerResource = createSwaggerObject(app);
    expect(swaggerResource.consumes).to.have.members([
      'application/json',
      'application/x-www-form-urlencoded',
      'application/xml', 'text/xml'
    ]);
  });

  it('has global "produces"', function() {
    var app = createLoopbackAppWithModel();
    var swaggerResource = createSwaggerObject(app);
    expect(swaggerResource.produces).to.have.members([
      'application/json',
      'application/xml', 'text/xml',
      // JSONP content types
      'application/javascript', 'text/javascript'
    ]);
  });

  describe('tags', function() {
    it('has one tag for each model', function() {
      var app = createLoopbackAppWithModel();
      var swaggerResource = createSwaggerObject(app);
      expect(swaggerResource.tags).to.eql([
        { name: 'Product', description: 'a-description\nline2' }
      ]);
    });
  });

  describe('paths node', function() {
    it('contains model routes for static methods', function() {
      var app = createLoopbackAppWithModel();
      var swaggerResource = createSwaggerObject(app);
      expect(swaggerResource.paths).to.have.property('/Products');
      var products = swaggerResource.paths['/Products'];
      var verbs = Object.keys(products);
      verbs.sort();
      expect(verbs).to.eql(['get', 'post', 'put']);
    });
  });

  describe('definitions node', function() {
    it('properly defines basic attributes', function() {
      var app = createLoopbackAppWithModel();
      var swaggerResource = createSwaggerObject(app);
      var data = swaggerResource.definitions.Product;
      expect(data.required.sort()).to.eql(['aNum', 'foo'].sort());
      expect(data.properties.foo.type).to.equal('string');
      expect(data.properties.bar.type).to.equal('string');
      expect(data.properties.aNum.type).to.equal('number');
      // These will be Numbers for Swagger 2.0
      expect(data.properties.aNum.minimum).to.equal(1);
      expect(data.properties.aNum.maximum).to.equal(10);
      // Should be Number even in 1.2
      expect(data.properties.aNum.default).to.equal(5);
    });

    it('includes models from "accepts" args', function() {
      var app = createLoopbackAppWithModel();
      givenPrivateAppModel(app, 'Image');
      givenSharedMethod(app.models.Product, 'setImage', {
        accepts: { name: 'image', type: 'Image' }
      });

      var swaggerResource = createSwaggerObject(app);
      expect(Object.keys(swaggerResource.definitions)).to.include('Image');
    });

    it('includes models from "returns" args', function() {
      var app = createLoopbackAppWithModel();
      givenPrivateAppModel(app, 'Image');
      givenSharedMethod(app.models.Product, 'getImage', {
        returns: { name: 'image', type: 'Image', root: true }
      });

      var swaggerResource = createSwaggerObject(app);
      expect(Object.keys(swaggerResource.definitions)).to.include('Image');
    });

    it('includes "accepts" models not attached to the app', function() {
      var app = createLoopbackAppWithModel();
      loopback.createModel('Image');
      givenSharedMethod(app.models.Product, 'setImage', {
        accepts: { name: 'image', type: 'Image' }
      });

      var swaggerResource = createSwaggerObject(app);
      expect(Object.keys(swaggerResource.definitions)).to.include('Image');
    });

    it('includes "responseMessages" models', function() {
      var app = createLoopbackAppWithModel();
      loopback.createModel('ValidationError');
      givenSharedMethod(app.models.Product, 'setImage', {
        errors: [{
          code: '422',
          message: 'Validation failed',
          responseModel: 'ValidationError'
        }]
      });

      var swaggerResource = createSwaggerObject(app);
      expect(Object.keys(swaggerResource.definitions))
        .to.include('ValidationError');
    });

    it('includes nested model references in properties', function() {
      var app = createLoopbackAppWithModel();
      givenWarehouseWithAddressModels(app);

      app.models.Product.defineProperty('location', { type: 'Warehouse' });

      var swaggerResource = createSwaggerObject(app);
      expect(Object.keys(swaggerResource.definitions))
        .to.include.members(['Address', 'Warehouse']);
    });

    it('includes nested array model references in properties', function() {
      var app = createLoopbackAppWithModel();
      givenWarehouseWithAddressModels(app);

      app.models.Product.defineProperty('location', { type: ['Warehouse'] });

      var swaggerResource = createSwaggerObject(app);
      expect(Object.keys(swaggerResource.definitions))
        .to.include.members(['Address', 'Warehouse']);
    });

    it('includes nested model references in modelTo relation', function() {
      var app = createLoopbackAppWithModel();
      givenWarehouseWithAddressModels(app);

      app.models.Product.belongsTo(app.models.Warehouse);

      var swaggerResource = createSwaggerObject(app);
      expect(Object.keys(swaggerResource.definitions))
        .to.include.members(['Address', 'Warehouse']);
    });

    it('includes nested model references in modelThrough relation', function() {
      var app = createLoopbackAppWithModel();
      givenWarehouseWithAddressModels(app);
      givenPrivateAppModel(app, 'ProductLocations');

      app.models.Product.hasMany(app.models.Warehouse,
        { through: app.models.ProductLocations });

      var swaggerResource = createSwaggerObject(app);
      expect(Object.keys(swaggerResource.definitions))
        .to.include.members(['Address', 'Warehouse', 'ProductLocations']);
    });

    it('includes nested model references in accept args', function() {
      var app = createLoopbackAppWithModel();
      givenWarehouseWithAddressModels(app);

      givenSharedMethod(app.models.Product, 'aMethod', {
        accepts: { arg: 'w', type: 'Warehouse' }
      });

      var swaggerResource = createSwaggerObject(app);
      expect(Object.keys(swaggerResource.definitions))
        .to.include.members(['Address', 'Warehouse']);
    });

    it('includes nested array model references in accept args', function() {
      var app = createLoopbackAppWithModel();
      givenWarehouseWithAddressModels(app);

      givenSharedMethod(app.models.Product, 'aMethod', {
        accepts: { arg: 'w', type: ['Warehouse'] }
      });

      var swaggerResource = createSwaggerObject(app);
      expect(Object.keys(swaggerResource.definitions))
        .to.include.members(['Address', 'Warehouse']);
    });

    it('includes nested model references in return args', function() {
      var app = createLoopbackAppWithModel();
      givenWarehouseWithAddressModels(app);

      givenSharedMethod(app.models.Product, 'aMethod', {
        returns: { arg: 'w', type: 'Warehouse', root: true }
      });

      var swaggerResource = createSwaggerObject(app);
      expect(Object.keys(swaggerResource.definitions))
        .to.include.members(['Address', 'Warehouse']);
    });

    it('includes nested array model references in return args', function() {
      var app = createLoopbackAppWithModel();
      givenWarehouseWithAddressModels(app);

      givenSharedMethod(app.models.Product, 'aMethod', {
        returns: { arg: 'w', type: ['Warehouse'], root: true }
      });

      var swaggerResource = createSwaggerObject(app);
      expect(Object.keys(swaggerResource.definitions))
        .to.include.members(['Address', 'Warehouse']);
    });

    it('includes nested model references in error responses', function() {
      var app = createLoopbackAppWithModel();
      givenWarehouseWithAddressModels(app);

      givenSharedMethod(app.models.Product, 'aMethod', {
        errors: {
          code: '222',
          message: 'Warehouse',
          responseModel: 'Warehouse'
        }
      });

      var swaggerResource = createSwaggerObject(app);
      expect(Object.keys(swaggerResource.definitions))
        .to.include.members(['Address', 'Warehouse']);
    });
  });

  function createLoopbackAppWithModel(apiRoot) {
    var app = loopback();

    app.dataSource('db', { connector: 'memory' });

    var Product = loopback.createModel('Product', {
      foo: {type: 'string', required: true},
      bar: 'string',
      aNum: {type: 'number', min: 1, max: 10, required: true, default: 5}
    }, { description: ['a-description', 'line2']  });
    app.model(Product, { dataSource: 'db' });

    // Simulate a restApiRoot set in config
    app.set('restApiRoot', apiRoot || '/api');
    app.use(app.get('restApiRoot'), loopback.rest());

    return app;
  }

  function givenSharedMethod(model, name, metadata) {
    model[name] = function() {};
    loopback.remoteMethod(model[name], metadata);
  }

  function givenPrivateAppModel(app, name, properties) {
    var model = loopback.createModel(name, properties);
    app.model(model, { dataSource: 'db', public: false });
  }

  function givenWarehouseWithAddressModels(app) {
    givenPrivateAppModel(app, 'Address');
    givenPrivateAppModel(app, 'Warehouse', {
      shippingAddress: { type: 'Address' }
    });
  }

  // Simple url joiner. Ensure we don't have to care about whether or not
  // we are fed paths with leading/trailing slashes.
  function urlJoin() {
    var args = Array.prototype.slice.call(arguments);
    return args.join('/').replace(/\/+/g, '/');
  }
});
