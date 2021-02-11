const { dbClose } = require("../lib/queries");

exports.mochaGlobalTeardown = async function() {
  return dbClose();
};
