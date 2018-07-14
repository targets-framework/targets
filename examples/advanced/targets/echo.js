'use strict';

module.exports = echo;

function echo ({ foo = 'default' }, print) {
    print(foo);
}
