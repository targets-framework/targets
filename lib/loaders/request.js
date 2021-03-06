'use strict';

module.exports = RequestLoader;

const axios = require('axios');
const map = require('lodash/map');
const camelCase = require('lodash/camelCase');
const mapKeys = require('lodash/mapKeys');
const uniq = require('lodash/uniq');
const uniqBy = require('lodash/uniqBy');
const pullAllBy = require('lodash/pullAllBy');
const { evaluate, predicate:evalPredicate } = require('../evaluate');

const compile = (acc, name, template, context) => {
    if (template == null) return acc;
    const templated = evaluate(`\`${template}\``, context);
    if (templated) acc[name] = templated;
    return acc;
};

const Prompt = (entry) => {
    /* eslint-disable no-unused-vars */
    const {
        name,
        type = 'input',
        argType,
        derived,
        template,
        message,
        when,
        default:defaultValue,
        optional,
        ...rest
    } = entry;
    /* eslint-enable no-unused-vars */
    const prompt = {
        name,
        type,
        message: message || name,
        ...rest
    };
    prompt.optional = !!optional;
    if (when) prompt.when = (answers) => evalPredicate(when, answers);
    if (defaultValue) prompt.default = defaultValue;
    return prompt;
};

const defaultPrompts = [
    {
        name: 'url'
    },
    {
        name: 'method',
        default: 'GET',
        optional: true
    },
    {
        name: 'baseURL',
        optional: true
    },
    {
        name: 'headers',
        optional: true
    },
    {
        name: 'params',
        optional: true
    },
    {
        name: 'data',
        optional: true
    },
    {
        name: 'timeout',
        optional: true
    },
    {
        name: 'withCredentials',
        optional: true
    },
    {
        name: 'adapter',
        optional: true
    },
    {
        name: 'auth',
        optional: true
    },
    {
        name: 'responseType',
        optional: true
    },
    {
        name: 'xsrfCookieName',
        optional: true
    },
    {
        name: 'xsrfHeaderName',
        optional: true
    },
    {
        name: 'maxContentLength',
        optional: true
    },
    {
        name: 'maxRedirects',
        optional: true
    },
    {
        name: 'socketPath',
        optional: true
    },
    {
        name: 'proxy',
        optional: true
    }
];

function RequestLoader(definition) {
    const { label, alias, spec = [], config:boundConfig = {}, silent } = definition;
    const { names, templates, prompts } = spec.reduce((acc, entry) => {
        const { name, argType = 'option', derived = false } = entry;

        acc.names.push(name);

        if (derived) {
            acc.prompts = pullAllBy(acc.prompts, [{ name }], 'name');
        } else {
            acc.prompts.push(Prompt(entry));
        }

        if (argType == 'variable') return acc;

        if (entry.template != null) {
            acc.templates[name] = entry.template;
            return acc;
        }

        console.log('ENTRY', entry);
        throw new Error('not sure what to do with:', name);

    }, { names: map(defaultPrompts, 'name'), templates: {}, prompts: defaultPrompts });

    const uniqNames = uniq(names);
    const uniqPrompts = uniqBy(prompts, 'name');

    const fallbackContext = uniqNames.reduce((acc, name) => {
        acc[camelCase(name)] = '';
        return acc;
    }, {});

    function requestTarget(options) {
        options.method = options.method = 'GET';
        const templateContext = mapKeys(options, (v, k) => camelCase(k));
        const context = { ...fallbackContext, ...templateContext, ...boundConfig };
        const opts = uniqNames.reduce((acc, name) => compile(acc, name, templates[name], context), options);
        return axios(opts).then(({ data }) => data);
    }

    requestTarget.config = boundConfig;
    if (typeof silent === 'boolean') requestTarget.silent = silent;
    if (typeof alias === 'string') requestTarget.alias = alias;
    if (typeof label === 'string') requestTarget.label = label;
    requestTarget.prompts = uniqPrompts;

    return requestTarget;
}
