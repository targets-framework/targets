'use strict';

const requireg = require('requireg');
const { spawnSync:spawn } = require('child_process');
const resolveGlobal = require('resolve-global');
const { isPromise, isReadableStream } = require('./util');
const streamToPromise = require('stream-to-promise');

function resolveTarget(targets, name) {
    if (targets[name]) return targets[name];
    let n = name;
    while (n.includes('.')) {
        n = n.split('.').slice(0, -1).join('.');
        if (targets[n] != null) return targets[n];
    }
    const scoped = `@targets/${name.split('.').shift()}`;
    try {
        resolveGlobal(scoped);
        return requireg(scoped);
    } catch (resolveGlobalError) {
        try {
            const install = spawn('npm', [ 'install', '--silent', '-g', scoped ], { encoding: 'utf8', stdio: 'inherit' });
            if (install.status != 0) throw 'unable to install';
            return requireg(scoped);
        } catch (globalInstallError) {
            throw new Error(`Unable to resolve target ${name}`);
        }
    }
}

function loadResource(name, target, loaders) {
    let fn;
    if (target != null && target.kind) {
        const { kind } = target;
        if (typeof loaders[kind] != 'function') throw new Error(`${kind} is not a valid loader`);
        fn = loaders[kind](target);
    } else {
        fn = target;
    }
    const wrapped = async (io, ctx) => {
        const result = await fn(io, { ...ctx, name });

        if (!isReadableStream(result.stdout || result)) return isPromise(result)
            ? result
            : result;

        const stdout = result.stdout || result;
        const streamPromises = [ streamToPromise(stdout) ];

        if (result.stderr) streamPromises.push(streamToPromise(result.stderr));

        return Promise.all(streamPromises)
            .then(([ stdout ]) => stdout.toString().trim());
    };

    return wrapped;
}

function Resolver(targets) {
    return function resolver(name) {
        const t = resolveTarget(targets, name);
        if (t.StartAt) return t;
        // TODO: handle this...
        return name;
    }
}

module.exports = {
    resolveTarget,
    loadResource,
    Resolver
};
