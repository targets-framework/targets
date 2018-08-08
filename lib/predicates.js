'use strict';

const get = require('lodash/get');

const Predicates = (predicates) => predicates.map(p => {
        if (typeof p === 'function') return p;
        if (typeof p === 'string') {
            if (p.includes('::')) {
                const [ a, b ] = p.split('::');
                return (c) => get(c, a) == get(c, b);
            } else {
                return (c) => {
                    const value = get(c, p);
                    return !!value && ![ '0', 'false' ].includes(value);
                };
            }
        }
        return () => true;
    });

module.exports = Predicates;
