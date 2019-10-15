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
    boolean,
    number,
    array,
    func,
    stringToArray
} = Joi.extend([ StringToArray ]).bind();

const source = stringToArray().default([]).items(string()).options({ convert: true });

exports.optionsSchema = object({
    name: string(),
    argv: array().items(string()),
    targets: object(),
    source,
    loaders: array().items(func()),
    __Answers__: func()
});

exports.stateSchema = object({
    _: array().items(string().regex(/[^-.].*/), boolean(), number()),
    '--': array().items(string()),
    source,
    input: object().pattern(string(), any())
});
