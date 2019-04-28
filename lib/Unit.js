'use strict';

module.exports = Unit;

const { merge } = require('sugarmerge');

const {
    isObject,
    isArray,
    isString,
    isFunction
} = require('./util');

const Target = require('./Target');

const Operation = require('./Operation');

const {
    OP_PREFIX,
    isOperation,
    isBindShorthand
} = Operation;

const { tag, hasTag } = require('./tags');

const conform = (arg) => (isBindShorthand(arg))
    ? `${OP_PREFIX}bind/${arg.replace(OP_PREFIX,'')}`
    : arg;

const isParallel = v => isString(v) && v.includes(',');
const isComposition = isArray;
const isDeclared = isObject;
const isName = isString;
const isTarget = isFunction;

function resolveTarget(targets, name) {
    while (name.includes('.')) {
        name = name.split('.').slice(0, -1).join('.');
        if (targets[name] != null) return targets[name];
    }
    return targets[name];
}

function Unit({
    arg,
    targets,
    operations,
    loaders = {},
    config = {},
    predicates = [],
    silent = false,
    name
}) {

    if (isParallel(arg)) {

        const parallel = arg.split(',');

        if (config) parallel.config = config;

        const unit = Unit({
            arg: parallel,
            targets,
            operations,
            loaders,
            config,
            predicates,
            silent,
            name
        });

        tag(unit, 'parallel');

        return unit;
    }

    if (isComposition(arg)) {

        if (hasTag(arg, 'parallel')) return arg;

        return arg.reduce((a, n) => [
                ...a,
                Unit({
                    arg: n,
                    targets,
                    operations,
                    loaders,
                    config: merge(config, arg.config || {}),
                    predicates: [
                        ...predicates,
                        ...(arg.predicates || [])
                    ],
                    silent
                })
            ], []);
    }

    if (isDeclared(arg)) {

        const { kind } = arg;

        if (!isFunction(loaders[kind])) throw new Error(`${kind} is not a valid loader`);

        const target = loaders[kind](arg);

        if (isString(target.alias)) {
            if (targets[target.alias] != null) throw new Error(`Alias: '${target.alias}' is already registered. Target names must be unique.`);
            targets[target.alias] = target;
        }

        return Unit({
            arg: target,
            targets,
            operations,
            loaders,
            config,
            predicates,
            silent,
            name: target.alias || name
        });
    }

    if (isName(arg)) {

        const conformed = conform(arg);

        if (isOperation(conformed)) return [
            Operation({
                operation: conformed,
                targets,
                operations,
                loaders,
                config,
                predicates,
                silent
            })
        ];

        return Unit({
            arg: resolveTarget(targets, conformed),
            targets,
            operations,
            loaders,
            config,
            predicates,
            name: conformed,
            silent
        });
    }

    if (isTarget(arg)) return [
        Target({
            fn: arg,
            config,
            predicates,
            name,
            silent
        })
    ];

    throw new Error(`invalid target in command: ${name}`);
}
