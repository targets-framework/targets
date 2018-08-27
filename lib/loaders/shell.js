'use strict';

module.exports = ShellLoader;

const camelCase = require('lodash/camelCase');
const mapKeys = require('lodash/mapKeys');
const { merge } = require('sugarmerge');
const Spawn = require('../Spawn');
const { evaluate } = require('../evaluate');

const maybeSpread = (name, value) =>
    '${(Array.isArray(' + name + ') ? ' + name + ' : [' + name + ']).reduce((a, __name__) => `${a ? `${a} ` : ""}'
        + value
        + '`, "")}';

const flag = (prefix, name, delim) =>
    '${(!__name__ || __name__ == "false") ? "" : ![ "true", "1", 1, true ].includes(__name__) ? `'
        + prefix
        + name
        + delim
        + '${__name__}` :  "'
        + prefix
        + name
        + '"}';

const flagAlwaysValue = (prefix, name, delim) =>
    '${(__name__ == null || __name__ == "") ? "" : `'
        + prefix
        + name
        + delim
        + '${__name__}`}';

const handleFlags = (acc, templated) => {
    const di = templated.indexOf(' ');
    return (di > -1)
        ? [
            ...acc,
            templated.slice(0, di),
            templated.slice(di + 1)
          ]
        : [
            ...acc,
            templated
          ];
};

const compile = (acc, template, context) => {
    if (template == null) return acc;
    const templated = evaluate(`\`${template}\``, context);
    if (templated) return handleFlags(acc, templated);
    return acc;
};

const Prompt = (entry) => {
    const { name, type = "input" } = entry;
    const prompt = {
        name,
        type,
        message: entry.message || name
    };
    if (entry.default) prompt.default = entry.default;
    if (entry.optional) prompt.optional = true;
    return prompt;
};

function ShellLoader(definition) {
    const { spec, label, alias, config:boundConfig = {}, silent } = definition;
    const { names, templates, prompts } = spec.reduce((acc, entry) => {
        if (typeof entry === 'string') {
            acc.names.push(entry);
            acc.templates[entry] = entry;
            return acc;
        }
        const { name, argType = 'option', derived = false } = entry;
        const cname = camelCase(name);

        acc.names.push(name);

        if (!derived) {
            acc.prompts.push(Prompt(entry));
        }

        if (argType == 'variable') return acc;

        if (entry.template != null) {
            if (derived && argType === 'option') {
                acc.templates[name] = `--${name} ${entry.template}`;
            } else if (derived && argType === 'flag') {
                acc.templates[name] = `-${name} ${entry.template}`;
            } else if (argType === 'option') {
                acc.templates[name] = '${' + cname + ' ? "--' + name + ' " : ""}' + entry.template;
            } else if (argType === 'flag') {
                acc.templates[name] = '${' + cname + ' ? "-' + name + ' " : ""}' + entry.template;
            } else {
                acc.templates[name] = entry.template;
            }
            return acc;
        }

        if (argType === 'command') {
            acc.templates[name] = maybeSpread(cname, name);
            return acc;
        }

        if (argType === 'value') {
            acc.templates[name] = maybeSpread(cname, '${' + cname + '}');
            return acc;
        }

        if ([ 'option', 'flag' ].includes(argType)) {
            const prefix = (argType === 'option') ? '--' : '-';
            const delim = (entry.useEquals) ? '=' : ' ';
            if (entry.useValue) {
                acc.templates[name] = maybeSpread(cname, flagAlwaysValue(prefix, name, delim));
            } else {
                acc.templates[name] = maybeSpread(cname, flag(prefix, name, delim));
            }
            return acc;
        }

        throw new Error('not sure what to do with:', name);

    }, { names: [], templates: {}, prompts: [] });

    const fallbackContext = names.reduce((acc, name) => {
        acc[camelCase(name)] = '';
        return acc;
    }, {});

    function shellTarget(options, print) {
        const templateContext = mapKeys(merge(boundConfig, options), (v, k) => camelCase(k));
        const context = { ...fallbackContext, ...templateContext };
        const argv = names.reduce((acc, name) => compile(acc, templates[name], context), []);
        const [ cmd, ...args ] = argv;
        print(`Running: ${argv.join(' ')}`);
        return Spawn()(cmd, args);
    }

    if (typeof silent === 'boolean') shellTarget.silent = silent;
    if (typeof alias === 'string') shellTarget.alias = alias;
    shellTarget.label = label || names[0];
    shellTarget.prompts = prompts;

    return shellTarget;
}
