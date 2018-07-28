'use strict';

exports.maybeSpread = (name, value) =>
    '${(Array.isArray(' + name + ') ? ' + name + ' : [' + name + ']).reduce((a, __name__) => `${a ? `${a} ` : ""}'
        + value
        + '`, "")}';

exports.flag = (prefix, name, delim) =>
    '${(!__name__ || __name__ == "false") ? "" : ![ "true", "1", 1, true ].includes(__name__) ? `'
        + prefix
        + name
        + delim
        + '${__name__}` :  "'
        + prefix
        + name
        + '"}';

exports.flagAlwaysValue = (prefix, name, delim) =>
    '${(__name__ == null || __name__ == "") ? "" : `'
        + prefix
        + name
        + delim
        + '${__name__}`}';
