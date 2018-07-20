'use strict';

exports.clone = v => JSON.parse(JSON.stringify(v));
exports.orObject = v => v == null ? {} : v;
exports.maybeStringify = v => {
    try {
        return JSON.stringify(v, null, 4);
    } catch (e) {
        return v;
    }
};
