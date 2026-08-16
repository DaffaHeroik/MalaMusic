const { wrap } = require('./_adapter');
const handler = require('../../api/email-auth');
exports.handler = wrap(handler);
