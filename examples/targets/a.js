'use strict';

const { promisify } = require('util');
const sleep = promisify(setTimeout);

const a = () => sleep(1000).then(() => `scheduler demo - ${(''+Math.floor(Date.now()/1000)).slice(-1)}`);

module.exports = a;
