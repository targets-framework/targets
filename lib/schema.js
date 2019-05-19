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

const source = stringToArray().default([]).items(string()).options({ convert: true });

exports.options = object({
    name: string(),
    argv: array().items(string()),
    targets: object(),
    source: source,
    operations: array().items(func()),
    loaders: array().items(func()),
    __Answers__: func()
});

exports.state = object({
    _: array().items(string().regex(/[^-.].*/)),
    '--': array().items(string()),
    setting: object({
        'label-style': string().valid('default', 'aligned'),
        mode: string().valid('dev', 'ci', 'tty')
    }),
    source,
    config: object().pattern(string(), any())
});

// TODO: consider allowing unknowns?
// .options({ allowUnknown: true });
