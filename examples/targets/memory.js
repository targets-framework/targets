'use strict';

const os = require('os');
const bytes = require('bytes');

function memory() {
    return Promise.resolve(bytes(os.freemem()));
}
memory.label = 'Free Memory';

module.exports = memory;
