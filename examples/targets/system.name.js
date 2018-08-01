'use strict';

module.exports = systemName;

function systemName() {
    return require('child_process').spawn('whoami');
}

systemName.filter = (result) => result.toUpperCase();
systemName.label = "System Name";
