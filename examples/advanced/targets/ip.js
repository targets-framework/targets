'use strict';

const os = require('os');
const find = require('lodash/find');
const get = require('lodash/get');

function ip() {
    const ip = get(find(get(os.networkInterfaces(), 'en0', []), { family: 'IPv4' }), 'address', 'unknown');
    return Promise.resolve(ip);
}

ip.label = 'Public IP';

module.exports = ip;
