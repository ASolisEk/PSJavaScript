const { randomBytes } = require('node:crypto');
module.exports = { getRandomBytes: (n) => new Uint8Array(randomBytes(n)) };
