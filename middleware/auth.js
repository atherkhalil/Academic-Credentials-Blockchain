const { unAes } = require("./crypto");
module.exports = function (req, res, next) {
  // Get KEY from header
  const KEY = req.header("API_KEY");

  if (!KEY) {
    // return res.status(401).json({ Error: "API_KEY_MISSING" });
  }
  // console.log("API_KEY: ", KEY);
  try {
    // let decoded = unAes(KEY);

    // if (decoded != process.env.PHRASE) {
    //   return res.status(400).json({ Error: "INVALID_API_KEY" });
    // }
    next();
  } catch (error) {
    return res.status(500).json({ Error: "AUTH_DENIED" });
  }
};
