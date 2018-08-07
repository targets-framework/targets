'use strict';
// rebind example on a composite target
// try invoking invoke with: ./examples/mycli --logger.location Seattle rebind
module.exports = [ '@prompts/off', '@logger.location::weather.location', 'weather' ];
