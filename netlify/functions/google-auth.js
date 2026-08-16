const { wrap } = require('./_adapter');
const handler = require('../../api/google-auth.js');

exports.handler = wrap(handler);
