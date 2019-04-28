'use strict';

module.exports = ShellLoader;

const camelCase = require('lodash/camelCase');
const mapKeys = require('lodash/mapKeys');
const inquirer = require('inquirer');
const merge = require('deepmerge');
const Spawn = require('../Spawn');
const { evaluate } = require('../evaluate');

const seq = async p => await p.reduce(async (chain, fn) => Promise.resolve([ ...(await chain), await fn() ]), Promise.resolve([]));

const getCollections = (obj, acc = {}) => typeof obj === 'object'
    ? Array.isArray(obj)
        ? { ...acc, ...obj.reduce((a, v) => getCollections(v, a), {}) }
        : { ...acc, ...Object.entries(obj).reduce((a, [ k, v ]) => (k === 'collections') ? { ...a, ...v } : getCollections(v, a), {}) }
    : acc;

function populateCollections(obj) {
    const acc = { ...obj };
    const collections = getCollections(obj);

    function walk(value) {
        return typeof value === 'object'
            ? Array.isArray(value)
                ? value.map(v => walk(v))
                : Object.entries(value).reduce((a, [ k, v ]) => {
                    a[k] = (k === 'args')
                        ? v.reduce((aa, arg) => {
                              if (arg.type === 'collection' && collections[arg.name]) return [ ...aa, ...walk(collections[arg.name]) ];
                              return [ ...aa, walk(arg) ];
                          }, [])
                        : walk(v);
                    return a;
                }, {})
            : value;
    }

    return walk(acc);
}

function prompts(acc, cmdPath, args, config, cmdKey) {
    if (args == null) throw new Error('invalid arguments');

    if (Array.isArray(args)) return [ ...acc, ...args.reduce((a, v) => [ ...a, ...prompts(acc, cmdPath, v, config, cmdKey) ], acc) ];

    if (args.command && cmdPath[0] === args.command) {
        if (typeof args.command !== 'string') throw new Error('invalid spec - command must be a string');
        const nextCmdPath = cmdPath.slice(1);
        const nextConfig = config[args.command] || {};
        const nextArgs = args.args || [];
        return [ ...acc, ...prompts(acc, nextCmdPath, nextArgs, nextConfig, cmdKey) ];
    }

    if (typeof args === 'string') args = { name: args };

    if (config[args.name] == null && args.required) {
        const name = `${cmdKey}.${args.name}`;
        return [ ...acc, () => inquirer.prompt([{
            name,
            type: 'input',
            message: name
        }]) ];
    }

    return acc;
}

function parseArgs(acc, cmdPath, args, config) {
    if (args == null) throw new Error('invalid arguments');

    if (Array.isArray(args)) return [ ...acc, ...args.reduce((a, v) => [ ...a, ...parseArgs(acc, cmdPath, v, config) ], acc) ];

    if (args.command && cmdPath[0] === args.command) {
        if (typeof args.command !== 'string') throw new Error('invalid spec - command must be a string');
        const nextCmdPath = cmdPath.slice(1);
        const nextConfig = config[args.command] || {};
        const nextArgs = args.args || [];
        return [ ...acc, args.command, ...parseArgs(acc, nextCmdPath, nextArgs, nextConfig) ];
    }

    if (typeof args === 'string') args = { name: args };

    if (args.default) config[args.name] = args.default;

    if (config[args.name] || [ 'variable', 'template' ].includes(args.type)) {
        let { name, type = 'option', useEquals, useValue } = args;
        const value = config[name] != null
            ? String(config[name])
            : null;
        let result;
        let ctx;
        switch (type) {
            case 'value':
                result = value;
                break;
            case 'option':
                result = `--${name}`;
                if (useValue === false) break;
                result = [ `--${result}`, value ];
                if (useEquals === true) result = result.join('=');
                break;
            case 'flag':
                result = `-${name}`;
                if (useEquals === true) {
                    result = [ `-${result}`, value ].join('=');
                } else if (useValue === true) {
                    result = [ `-${result}`, value ];
                }
                break;
            case 'variable':
                config[name] = value;
                break;
            case 'template':
                ctx = mapKeys(config, (v, k) => camelCase(k));
                result = Array.isArray(args.template)
                    ? args.template.map(v => evaluate(`\`${v}\``, ctx))
                    : evaluate(`\`${args.template}\``, ctx);
                break;
            default:
                throw new Error(`invalid argument type: ${type}`);
        }
        if (result != null) return [ ...acc, ...(Array.isArray(result) ? result : [ result ]) ];
    }
    return acc;
}

function ShellLoader(definition) {
    if (definition == null) throw new Error('invalid definition');

    let { spec, label, alias, config:boundConfig = {}, silent } = definition;

    if (spec == null || typeof spec !== 'object') throw new Error('invalid spec');

    let command;

    if (!Array.isArray(spec)) {
        if (!spec.command) throw new Error('invalid spec - missing main command definition');
        spec = populateCollections(spec);
        command = spec.command;
        spec = spec.args || [];
    } else {
        command = spec[0];
        spec = spec.slice(1);
    }

    async function shellTarget(config = {}, { name:cmdPath, print }) {
        config = merge(boundConfig, config); // TODO: is bound config higher or lower precedence? Using lower precedence and treating as a map of defaults for now.
        cmdPath = Array.isArray(cmdPath)
            ? cmdPath.slice(1)
            : cmdPath.split('.').slice(1);
        const answers = await seq(prompts([], cmdPath, spec, config, cmdPath.join('.')));
        const args = parseArgs([], cmdPath, spec, merge(config, ...(answers.length ? answers : [{}])));
        print(`Running: ${[ command, ...args ].join(' ')}`);
        return Spawn()(command, args);

    }
    if (typeof silent === 'boolean') shellTarget.silent = silent;
    if (typeof alias === 'string') shellTarget.alias = alias;
    shellTarget.label = label || command;

    return shellTarget;
}

//'use strict';

//module.exports = ShellLoader;

//const camelCase = require('lodash/camelCase');
//const mapKeys = require('lodash/mapKeys');
//const { merge } = require('sugarmerge');
//const Spawn = require('../Spawn');
//const { evaluate, predicate:evalPredicate } = require('../evaluate');

//const maybeSpread = (name, value) =>
    //'${(Array.isArray(' + name + ') ? ' + name + ' : [' + name + ']).reduce((a, __name__) => `${a ? `${a} ` : ""}'
        //+ value
        //+ '`, "")}';

//const flag = (prefix, name, delim) =>
    //'${(!__name__ || __name__ == "false") ? "" : ![ "true", "1", 1, true ].includes(__name__) ? `'
        //+ prefix
        //+ name
        //+ delim
        //+ '${__name__}` :  "'
        //+ prefix
        //+ name
        //+ '"}';

//const flagAlwaysValue = (prefix, name, delim) =>
    //'${(__name__ == null || __name__ == "") ? "" : `'
        //+ prefix
        //+ name
        //+ delim
        //+ '${__name__}`}';

//const handleFlags = (acc, templated) => {
    //const di = templated.indexOf(' ');
    //return (di > -1)
        //? [
            //...acc,
            //templated.slice(0, di),
            //templated.slice(di + 1)
          //]
        //: [
            //...acc,
            //templated
          //];
//};

//const compile = (acc, template, context) => {
    //if (template == null) return acc;
    //const templated = evaluate(`\`${template}\``, context);
    //if (templated) return handleFlags(acc, templated);
    //return acc;
//};

//const Prompt = (entry) => {
    //[> eslint-disable no-unused-vars <]
    //const {
        //name,
        //type = 'input',
        //argType,
        //derived,
        //template,
        //message,
        //when,
        //default:defaultValue,
        //optional,
        //...rest
    //} = entry;
    //[> eslint-enable no-unused-vars <]
    //const prompt = {
        //name,
        //type,
        //message: message || name,
        //...rest
    //};
    //prompt.optional = !!optional;
    //if (when) prompt.when = (answers) => evalPredicate(when, answers);
    //if (defaultValue) prompt.default = defaultValue;
    //return prompt;
//};

//function ShellLoader(definition) {
    //const { spec, label, alias, config:boundConfig = {}, silent } = definition;
    //const { names, templates, prompts } = spec.reduce((acc, entry) => {
        //if (typeof entry === 'string') {
            //acc.names.push(entry);
            //acc.templates[entry] = entry;
            //return acc;
        //}
        //const { name, argType = 'option', derived = false } = entry;
        //const cname = camelCase(name);

        //acc.names.push(name);

        //if (!derived) {
            //acc.prompts.push(Prompt(entry));
        //}

        //if (argType == 'variable') return acc;

        //if (entry.template != null) {
            //if (derived && argType === 'option') {
                //acc.templates[name] = `--${name} ${entry.template}`;
            //} else if (derived && argType === 'flag') {
                //acc.templates[name] = `-${name} ${entry.template}`;
            //} else if (argType === 'option') {
                //acc.templates[name] = '${' + cname + ' ? "--' + name + ' " : ""}' + entry.template;
            //} else if (argType === 'flag') {
                //acc.templates[name] = '${' + cname + ' ? "-' + name + ' " : ""}' + entry.template;
            //} else {
                //acc.templates[name] = entry.template;
            //}
            //return acc;
        //}

        //if (argType === 'command') {
            //acc.templates[name] = maybeSpread(cname, name);
            //return acc;
        //}

        //if (argType === 'value') {
            //acc.templates[name] = maybeSpread(cname, '${' + cname + '}');
            //return acc;
        //}

        //if ([ 'option', 'flag' ].includes(argType)) {
            //const prefix = (argType === 'option') ? '--' : '-';
            //const delim = (entry.useEquals) ? '=' : ' ';
            //if (entry.useValue) {
                //acc.templates[name] = maybeSpread(cname, flagAlwaysValue(prefix, name, delim));
            //} else {
                //acc.templates[name] = maybeSpread(cname, flag(prefix, name, delim));
            //}
            //return acc;
        //}

        //throw new Error('not sure what to do with:', name);

    //}, { names: [], templates: {}, prompts: [] });

    //const fallbackContext = names.reduce((acc, name) => {
        //acc[camelCase(name)] = '';
        //return acc;
    //}, {});

    //function shellTarget(options, print) {
        //const templateContext = mapKeys(merge(boundConfig, options), (v, k) => camelCase(k));
        //const context = { ...fallbackContext, ...templateContext };
        //const argv = names.reduce((acc, name) => compile(acc, templates[name], context), []);
        //const [ cmd, ...args ] = argv;
        //print(`Running: ${argv.join(' ')}`);
        //return Spawn()(cmd, args);
    //}

    //if (typeof silent === 'boolean') shellTarget.silent = silent;
    //if (typeof alias === 'string') shellTarget.alias = alias;
    //shellTarget.label = label || names[0];
    //shellTarget.prompts = prompts;

    //return shellTarget;
//}
