'use strict';

const spawn = require('child_process').spawn;

function tcpdump() {
    return spawn('tcpdump', ['-i', 'en0', '-n', '-s', '0']);
}

module.exports = tcpdump;

