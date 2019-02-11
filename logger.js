var winston = require('winston')

var logger = function () {
  let logger = winston.createLogger({
    transports: [
      new winston.transports.Console({
        format: winston.format.simple()
      })
    ]
  })

  return logger
}

module.exports = logger
