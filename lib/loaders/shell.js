'use strict';

module.exports = ShellLoader;

const ShellSpec = require('shellspec');
const merge = require('deepmerge');
const Spawn = require('../Spawn');

function ShellLoader(definition) {
    const loader = ShellSpec(definition);

    let {
        spec,
        label,
        alias,
        config:boundConfig = {},
        silent
    } = definition;

    async function shellTarget(config = {}, { name:cmdPath, print }) {
        config = merge(boundConfig, config); // TODO: is bound config higher or lower precedence? Using lower precedence and treating as a map of defaults for now.
        cmdPath = Array.isArray(cmdPath)
            ? cmdPath.slice(1)
            : cmdPath.split('.').slice(1);
        const [ command, ...args ] = await loader.promptedArgv(config, cmdPath);
        print(`Running: ${[ command, ...args ].join(' ')}`);
        return Spawn()(command, args);
    }
    if (typeof silent === 'boolean') shellTarget.silent = silent;
    if (typeof alias === 'string') shellTarget.alias = alias;
    shellTarget.label = label || spec.command;

    return shellTarget;
}
