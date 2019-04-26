'use strict';
const Joi = require('@hapi/joi');

const StringToArray = joi => ({
    base: joi.array(),
    name: 'stringToArray',
    coerce (value, state, options) { /* eslint-disable-line */
        return (typeof value === 'string')
            ? [ value ]
            : value;
    }
});

const {
    any,
    object,
    string,
    array,
    func,
    stringToArray
} = Joi.extend([ StringToArray ]).bind();

const mode = exports.mode = string().valid('dev', 'ci', 'tty');
const labelStyle = exports.labelStyle = string().valid('default', 'aligned');
const setting = exports.setting = object({
    'label-style': labelStyle,
    mode
});
const source = exports.source = stringToArray().default([]).items(string()).options({ convert: true });
const config = exports.config = object().pattern(string(), any());
const names = array().items(string().regex(/[^-.].*/));
const args = array().items(string());

const name = string().default('targets');
const targets = object().default({});
const argv = array().items(string()).default(process.argv.slice(2));
const operations = array().items(func());
const loaders = array().items(func());

exports.options = object({
    name,
    argv,
    givenTargets: targets,
    givenSource: source,
    customOperations: operations,
    customLoaders: loaders,
    Answers: func()
}).rename('targets', 'givenTargets')
  .rename('source', 'givenSource')
  .rename('operations', 'customOperations')
  .rename('loaders', 'customLoaders');

exports.state = object({
    _: names,
    '--': args,
    setting,
    source,
    config
});
