'use strict';

const spawn = require('child_process').spawn;

const tcpdump = () => spawn('tcpdump', ['-i', 'en0', '-n', '-s', '0']);

module.exports = tcpdump;
