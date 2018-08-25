'use strict';

// bind example on a composite target
// try invoking with: ./examples/mycli --logger.location Seattle rebind

module.exports = [ '@prompts/off', '@config.logger.location::config.weather.location', 'weather' ];
