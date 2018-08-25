'use strict';

const systemName = () => require('child_process').spawn('whoami');

systemName.filter = (result) => result.toUpperCase();
systemName.label = "System Name";

module.exports = systemName;
