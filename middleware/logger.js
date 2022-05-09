let log = [];

module.exports = {
  logInfo: (msg) => {
    log.push(msg);
  },
  log: log,
};
