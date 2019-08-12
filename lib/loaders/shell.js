'use strict';

module.exports = ShellLoader;

const ShellSpec = require('shellspec');
const { merge } = require('sugarmerge');
const { spawn } = require('child_process');

function ShellLoader(definition) {
    const loader = ShellSpec(definition);

    let {
        spec
    } = definition;

    async function shellTarget(config = {}, { Resource:cmdPath }) { // TODO: second arg is currently, `onCancel` ... needs to pass reflection context
        cmdPath = Array.isArray(cmdPath)
            ? cmdPath.slice(1)
            : cmdPath.split('.').slice(1);
        const [ command, ...args ] = await loader.promptedArgv(config, cmdPath);
        return spawn(command, args);
    }

    return shellTarget;
}
