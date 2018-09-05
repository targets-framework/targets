'use strict';

const Target = require('../Target');
const { tag } = require('../tags');
const { isString } = require('../util');

const inspect = (targetName, { targets }) => Target({ fn: (c, print) => {
    const target = targets[targetName];
    if (target) {
        const ns = targetName.split('.').shift();
        const { prompts = [] } = target;
        const inputs = prompts.map(p => isString(p) ? p : p.name || 'unknown');
        if (inputs.length > 0) {
            print(`defined inputs for "${targetName}":`);
            inputs.forEach(i => print(`    config.${targetName.includes('.') ? `${ns}.` : ''}${i}`));
        } else {
            print(`no known inputs for ${targetName}`);
        }
    } else {
        throw new Error(`target ${targetName} not found`);
    }
}, name: '@inspect' });
tag(inspect, 'target');

module.exports = {
    inspect
};
