const express = require("express");
const route = express.Router();
const { hash, aes, unAes } = require("../middleware/crypto");
const auth = require("../middleware/auth");
const logger = require("../middleware/logger");
const nimble = require("@runonbitcoin/nimble");
let creddy = require("../app");
const { check, validationResult } = require("express-validator");
const { Mutex } = require("async-mutex");
const mutex = new Mutex();

route.get(
  "/verify",
  [
    check("id", "id is required!").not().isEmpty(),
    check("publicKey", "Public key length must be 66!").isLength({
      min: 66,
      max: 66,
    }),
  ],
  auth,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors.array());
      logger.logInfo({
        logType: "Verify Accreditation Error | Missing Params",
        logTime: new Date().toString(),
        msg: `Missing parameters to verify accreditation`,
        error: errors.array(),
      });
      return res.status(400).json({
        error: "Missing Parameter(s)!",
        missingParams: errors.array(),
      });
    }

    logger.logInfo({
      logType: `Verify Issuer ${req.body.id} Accreditation`,
      logTime: new Date().toString(),
    });

    console.log("Issuer ID: ", req.body.id);
    console.log("Public Key: ", req.body.publicKey);

    try {
      creddy = await creddy;
      const verification = await creddy.verifyAccreditation(req.body);

      if (verification != false) {
        logger.logInfo({
          logType: "Issuer Successfully Verified",
          logTime: new Date().toString(),
          msg: `Issuer ${req.body.id} Accreditation Successfully Verified`,
        });

        return res.status(200).send(verification);
      }
      return res.status(400).send("Issuer Accreditation Not Verified");
    } catch (error) {
      console.log(`Verify Accreditation Error: `, error);
      logger.logInfo({
        logType: "Verify Accreditation Error",
        logTime: new Date().toString(),
        msg: `Error while verifying issuer accreditation`,
        error: error.toString(),
      });
      return res.status(500).json({ error: "INTERNAL SERVER ERROR" });
    }
  }
);

route.post(
  "/new",
  [
    check("id", "id is required!").not().isEmpty(),
    check("issuerName", "issuerName is required!").not().isEmpty(),
    check("publicKey", "Public key length must be 66!").isLength({
      min: 66,
      max: 66,
    }),
  ],
  auth,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors.array());
      logger.logInfo({
        logType: "Issuer Accreditation Error | Missing Params",
        logTime: new Date().toString(),
        msg: `Missing parameters for Accreditation`,
        error: errors.array(),
      });
      return res.status(400).json({
        error: "Missing Parameter(s)!",
        missingParams: errors.array(),
      });
    }

    logger.logInfo({
      logType: `New Issuer Accreditation`,
      logTime: new Date().toString(),
    });

    console.log("Issuer ID: ", req.body.id);
    console.log("Issuer Name: ", req.body.issuerName);
    console.log("Public Key: ", req.body.publicKey);

    const release = await mutex.acquire();

    try {
      creddy = await creddy;
      const { txnId } = await creddy.accreditIssuer(req.body);
      await creddy.sync();

      logger.logInfo({
        logType: "Issuer Successfully Accredited",
        logTime: new Date().toString(),
        msg: `Issuer ${req.body.issuerName} Successfully Accredited`,
        txnId: txnId,
      });

      return res.status(200).send("Issuer Successfully Accredited");
    } catch (error) {
      console.log(`Accreditation Error: `, error);
      logger.logInfo({
        logType: "Accreditation Error",
        logTime: new Date().toString(),
        msg: `Error while accrediting issuer`,
        error: error.toString(),
      });
      return res.status(500).json({ error: "INTERNAL SERVER ERROR" });
    } finally {
      release();
    }
  }
);

module.exports = route;
