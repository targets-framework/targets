'use strict';

const os = require('os');
const Promise = require('bluebird');
const _ = require('lodash');

function ip(answers) {
    const ip = _.result(_.find(_.result(os.networkInterfaces(), 'en0', []), { family: 'IPv4' }), 'address', 'unknown');
    return Promise.resolve(ip);
}

ip.label = 'Public IP';

module.exports = ip;
