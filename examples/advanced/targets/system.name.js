'use strict';

module.exports = systemName;

function systemName() {
    return require('child_process').spawn('whoami');
}
systemName.label = "System Name";
