'use strict';

module.exports = githubUser;

function githubUser({ username = 'machellerogden' }) {
    return require('axios').get(`https://api.github.com/users/${username}`)
        .then(({ data }) => data);
}
githubUser.silent = true;
