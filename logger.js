var winston = require('winston');

var logger = function(){
  return new (winston.Logger)({
    transports: [
      new (winston.transports.File)({
        name: 'info-file',
        filename: 'logs/general.log',
        level: 'info'
      }),
      new (winston.transports.File)({
        name: 'error-file',
        filename: 'logs/errors.log',
        level: 'error'
      })
    ]
  });
}

module.exports = logger;
