'use strict';

module.exports = ShellTarget;

const camelCase = require('lodash/camelCase');
const mapKeys = require('lodash/mapKeys');
const answers = require('answers');

const tty = require('../tty');
const { spawn } = require('child_process');
const { evaluate } = require('../util');
const { maybeSpread, flag, flagAlwaysValue } = require('../EL');

const handleFlags = (acc, templated) => {
    const di = templated.indexOf(' ');
    if (di > -1) {
        const parts = [
            templated.slice(0, di),
            templated.slice(di + 1)
        ];
        return [ ...acc, ...parts ];
    } else {
        return [ ...acc, templated ];
    }
};

const compile = (acc, template, context) => {
    if (template == null) return acc;
    const templated = evaluate(`\`${template}\``, context);
    if (templated) return handleFlags(acc, templated);
    return acc;
};

function ShellTarget(definition, boundConfig) {
    const { spec } = definition;
    const { names, templates, prompts } = spec.reduce((acc, entry) => {
        if (typeof entry === 'string') {
            acc.names.push(entry);
            acc.templates[entry] = entry;
            return acc;
        }
        const { name, type = 'option', derived = false } = entry;
        const cname = camelCase(name);

        acc.names.push(name);

        if (!derived) {
            acc.prompts.push(Prompt(entry));
        }

        if (type == 'variable') return acc;

        if (entry.template != null) {
            if (derived && type === 'option') {
                acc.templates[name] = `--${name} ${entry.template}`;
            } else if (derived && type === 'flag') {
                acc.templates[name] = `-${name} ${entry.template}`;
            } else if (type === 'option') {
                acc.templates[name] = '${' + cname + ' ? "--' + name + ' " : ""}' + entry.template;
            } else if (type === 'flag') {
                acc.templates[name] = '${' + cname + ' ? "-' + name + ' " : ""}' + entry.template;
            } else {
                acc.templates[name] = entry.template;
            }
            return acc;
        }

        if (type === 'command') {
            acc.templates[name] = maybeSpread(cname, name);
            return acc;
        }

        if (type === 'value') {
            acc.templates[name] = maybeSpread(cname, '${' + cname + '}');
            return acc;
        }

        if ([ 'option', 'flag' ].includes(type)) {
            const prefix = (type === 'option') ? '--' : '-';
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

    function cmdTarget(options, print) {
        const templateContext = mapKeys(answers.composer(options, boundConfig), (v, k) => camelCase(k));
        const context = { ...fallbackContext, ...templateContext };
        const argv = names.reduce((acc, name) => compile(acc, templates[name], context), []);
        const [ cmd, ...args ] = argv;
        print(`Running: ${argv.join(' ')}`);
        if (tty.isTTY) {
           tty().spawnTerminal(cmd, args);
        } else {
            return spawn(cmd, args);
        }
        return;
    }

    cmdTarget.label = names[0];
    cmdTarget.prompts = prompts;

    return cmdTarget;
}

function Prompt(entry) {
    const { name } = entry;
    const prompt = {
        name,
        type: "input",
        message: entry.message || name
    };
    if (entry.default) prompt.default = entry.default;
    if (entry.optional) prompt.optional = true;
    return prompt;
}
