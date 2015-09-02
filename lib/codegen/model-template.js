var fs = require('fs');
var path = require('path');

var template = fs.readFileSync(path.join(__dirname, 'model.ejs'), 'UTF-8');
module.exports = template;
