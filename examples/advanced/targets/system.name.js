'use strict';

module.exports = systemName;

function systemName() {
    return require('child_process').spawn('whoami');
}
systemName.transformer = (result) => {
    return result.toUpperCase();
};
systemName.label = "System Name";
