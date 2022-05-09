const express = require("express");
const route = express.Router();
const { hash, aes, unAes } = require("../middleware/crypto");
const auth = require("../middleware/auth");
const logger = require("../middleware/logger");
// let bsv = require("bsv");
const nimble = require("@runonbitcoin/nimble");

route.get("/issue", auth, async (req, res) => {
  logger.logInfo({
    logType: `Private Key Issue Request`,
    logTime: new Date().toString(),
  });

  // let privateKey = bsv.PrivKey.fromRandom("testnet");
  // let publicKey = bsv.PubKey.fromPrivKey(privateKey);
  // let address = bsv.Address.fromPubKey(publicKey, "testnet");

  const privateKey = nimble.PrivateKey.fromRandom();
  const publicKey = privateKey.toPublicKey().toString();
  const address = privateKey.toAddress().toString();

  console.log("privateKey: ", privateKey);
  console.log("publicKey: ", publicKey);
  console.log("address: ", address);

  try {
    logger.logInfo({
      logType: "Private Key Issued",
      logTime: new Date().toString(),
      msg: `Private Key ${privateKey.toString()} Issued`,
    });

    return res.json({
      privateKey: privateKey.toString(),
      publicKey: publicKey,
      address: address,
    });
  } catch (error) {
    console.log(`PrivateKey Issuance Error: `, error);
    logger.logInfo({
      logType: "PrivateKey Issuance Error",
      logTime: new Date().toString(),
      msg: `Error while issuing PrivateKey`,
      error: error.toString(),
    });
    return res.status(500).json({ error: "INTERNAL SERVER ERROR" });
  }
});

module.exports = route;
