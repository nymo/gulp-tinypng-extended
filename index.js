var implementation = require.resolve('./dist/index.js');

delete require.cache[implementation];
module.exports = require(implementation);
