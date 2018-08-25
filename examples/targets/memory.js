'use strict';

const os = require('os');
const bytes = require('bytes');

const memory = () => bytes(os.freemem());
memory.label = 'Free Memory';

module.exports = memory;
