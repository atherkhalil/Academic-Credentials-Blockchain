const express = require("express");
const route = express.Router();
const { check, validationResult } = require("express-validator");
let creddy = require("../app");
const { hash, aes, unAes } = require("../middleware/crypto");
const { Mutex } = require("async-mutex");
const mutex = new Mutex();
const {
  createCredential,
  signWithECDSA,
  verifyECDSA,
} = require("../middleware/utils");
const auth = require("../middleware/auth");
const logger = require("../middleware/logger");
const nimble = require("@runonbitcoin/nimble");

route.post(
  "/create",
  [
    check("id", "id is required!").not().isEmpty(),
    check("type", "type is required!").not().isEmpty(),
    check("courseId", "courseId is required!").not().isEmpty(),
    check("level", "level is required!").not().isEmpty(),
    check("title", "title is required!").not().isEmpty(),
    check("description", "description is required!").not().isEmpty(),
    check("faculty", "faculty is required!").not().isEmpty(),
    check("session", "session is required!").not().isEmpty(),
    check("creditHours", "creditHours is required!").not().isEmpty(),
    check("cgpa", "cgpa is required!").not().isEmpty(),
    check("credentialUrl", "credentialUrl is required!").not().isEmpty(),
    check("issuanceDate", "issuanceDate is required!").not().isEmpty(),
    check("issuer", "issuer is required!").not().isEmpty(),
    check("learner", "learner is required!").not().isEmpty(),
    check("moe", "moe is required!").not().isEmpty(),
    check("priv_key", "Issuer Private Key is required!").not().isEmpty(),
  ],
  auth,
  async (req, res) => {
    console.log(`Credential Request: ${req.body.id}`);
    logger.logInfo({
      logType: `Credential Creation Request: ${req.body.id}`,
      logTime: new Date().toString(),
    });
    const errors = validationResult(req);
    // console.log(req.body);
    if (!errors.isEmpty()) {
      console.log(errors.array());
      logger.logInfo({
        logType: "Credential Creation Error | Missing Params",
        logTime: new Date().toString(),
        msg: `Missing parameters for Credential: ${req.body.id}`,
        error: errors.array(),
      });
      return res.status(400).json({
        error: "Missing Parameter(s)!",
        missingParams: errors.array(),
      });
    }

    const release = await mutex.acquire();

    try {
      creddy = await creddy;
      const privateKey = nimble.PrivateKey.fromString(req.body.priv_key);
      req.body.issuer.publicKey = privateKey.toPublicKey().toString();
      console.log("Issuer PubKey: ", privateKey.toPublicKey().toString());

      if (req.body.issuer.type == "ACCREDITED") {
        const verification = await creddy.verifyAccreditation(req.body.issuer);
        if (verification == false)
          return res.status(400).json({
            Error: "Institute Not Accredited!",
          });
      }

      let obj = {
        body: {
          id: req.body.id,
          type: aes(req.body.type),
          courseId: aes(req.body.courseId),
          level: aes(req.body.level),
          title: aes(req.body.title),
          description: aes(req.body.description),
          faculty: aes(req.body.faculty),
          session: aes(req.body.session),
          creditHours: aes(req.body.creditHours),
          cgpa: aes(req.body.cgpa),
          credentialUrl: aes(req.body.credentialUrl),
          issuanceDate: new Date(req.body.issuanceDate).valueOf(),
          expiryDate: req.body.expiryDate
            ? new Date(req.body.expiryDate).valueOf()
            : "null",
          issuer: aes(JSON.stringify(req.body.issuer)),
          learner: aes(JSON.stringify(req.body.learner)),
          moe: aes(JSON.stringify(req.body.moe)),
          timeStamp: Date.now(),
        },
      };
      obj.body.credentialHash = hash(obj);

      console.log(
        "Credential '" + obj.body.id + "' Hash => ",
        obj.body.credentialHash
      );

      const { txnId } = await createCredential(obj);
      console.log(
        `Credential ${obj.body.id} created by ${req.body.issuer.issuerName} | TxnID: ${txnId}`
      );

      logger.logInfo({
        logType: "Credential Created",
        logTime: new Date().toString(),
        msg: `Credential ${req.body.id} Created`,
        txnID: txnId,
        requestBody: req.body,
      });

      return res.json({
        success: `Credential '${req.body.id}' posted to the Blockchain!`,
        txnId: txnId,
      });
    } catch (error) {
      console.log(`Credential ${req.body.id} Creation Error: `, error);
      logger.logInfo({
        logType: "Credential Creation Error",
        logTime: new Date().toString(),
        msg: `Error while creating Credential ${req.body.id}`,
        error: error.toString(),
      });
      if (error == "Error: bad checksum")
        return res.status(400).json({ error: "INVALID KEY" });
      return res.status(500).json({ error: "INTERNAL SERVER ERROR" });
    } finally {
      release();
    }
  }
);

route.get("/get/:id", auth, async (req, res) => {
  if (req.params.id == null || req.params.id.trim().length <= 0) {
    return res.status(400).json({ error: "id is required!" });
  }

  try {
    creddy = await creddy;
    const data = creddy.getCredential(req.params.id);
    // console.log(data);
    if (data != "" && data != null) {
      // console.log(data);
      let response = {
        body: {
          id: data.body.id,
          type: unAes(data.body.type),
          courseId: unAes(data.body.courseId),
          level: unAes(data.body.level),
          title: unAes(data.body.title),
          description: unAes(data.body.description),
          faculty: unAes(data.body.faculty),
          session: unAes(data.body.session),
          creditHours: unAes(data.body.creditHours),
          cgpa: unAes(data.body.cgpa),
          credentialUrl: unAes(data.body.credentialUrl),
          issuanceDate: new Date(data.body.issuanceDate).toUTCString(),
          expiryDate: data.body.expiryDate
            ? new Date(data.body.expiryDate).toUTCString()
            : "null",
          issuer: JSON.parse(unAes(data.body.issuer)),
          learner: JSON.parse(unAes(data.body.learner)),
          moe: JSON.parse(unAes(data.body.moe)),
          equivalency: data.body.equivalency
            ? unAes(data.body.equivalency)
            : {},
          revocation: data.body.revocation
            ? JSON.parse(unAes(data.body.revocation))
            : {},
          credentialHash: data.body.credentialHash,
          timeStamp: data.body.timeStamp,
        },
        issuerECDSA: data.issuerECDSA ? data.issuerECDSA : {},
        learnerECDSA: data.learnerECDSA ? data.learnerECDSA : {},
        moeECDSA: data.moeECDSA ? data.moeECDSA : {},
        txnId: data.txnId,
      };
      return res.status(200).send(response);
    }
    return res.status(404).json({ Error: "Credential Not Found!" });
  } catch (error) {
    console.log("Credential Get Error: ", error);
    return res.status(500).json({ Error: "INTERNAL SERVER ERROR" });
  }
});

route.get("/history/:id", auth, async (req, res) => {
  if (req.params.id == null || req.params.id.trim().length <= 0) {
    return res.status(400).json({ error: "id is required!" });
  }

  try {
    creddy = await creddy;
    const data = await creddy.getCredentialHistory(req.params.id);
    // console.log("Credential Data", data);
    if (data != "" && data != null) {
      let response = [];
      data.map((e) => {
        let obj = {
          body: {
            id: e.body.id,
            type: unAes(e.body.type),
            courseId: unAes(e.body.courseId),
            level: unAes(e.body.level),
            title: unAes(e.body.title),
            description: unAes(e.body.description),
            session: unAes(e.body.session),
            creditHours: unAes(e.body.creditHours),
            cgpa: unAes(e.body.cgpa),
            credentialUrl: unAes(e.body.credentialUrl),
            issuanceDate: new Date(e.body.issuanceDate).toUTCString(),
            expiryDate: e.body.expiryDate
              ? new Date(e.body.expiryDate).toUTCString()
              : "null",
            issuer: JSON.parse(unAes(e.body.issuer)),
            learner: JSON.parse(unAes(e.body.learner)),
            moe: JSON.parse(unAes(e.body.moe)),
            equivalency: e.body.equivalency ? unAes(e.body.equivalency) : {},
            revocation: e.body.revocation
              ? JSON.parse(unAes(e.body.revocation))
              : {},
            credentialHash: e.body.credentialHash,

            timeStamp: e.body.timeStamp,
          },
          issuerECDSA: e.issuerECDSA ? e.issuerECDSA : {},
          learnerECDSA: e.learnerECDSA ? e.learnerECDSA : {},
          moeECDSA: e.moeECDSA ? e.moeECDSA : {},
          txnId: e.txnId,
        };
        response.push(obj);
      });
      return res.status(200).send(response);
    }
    return res.status(404).json({ Error: "Credential Not Found!" });
  } catch (error) {
    console.log("Credential History Error: ", error);
    return res.status(500).json({ Error: "INTERNAL SERVER ERROR" });
  }
});

route.post(
  "/signWithECDSA",
  [
    check("type", "type is required!").not().isEmpty(),
    check("credentialId", "credentialId is required!").not().isEmpty(),
    check("privateKey", "issuanceDate is required!").not().isEmpty(),
  ],
  auth,
  async (req, res) => {
    console.log(`Credential Signing by Institute`);
    logger.logInfo({
      logType: `Credential Signing with ECDSA`,
      logTime: new Date().toString(),
    });
    const errors = validationResult(req);
    // console.log(req.body);
    if (!errors.isEmpty()) {
      console.log(errors.array());
      logger.logInfo({
        logType: "Credential Signing with ECDSA Error | Missing Params",
        logTime: new Date().toString(),
        msg: `Missing parameters for Credential Signing with ECDSA`,
        error: errors.array(),
      });
      return res.status(400).json({
        error: "Missing Parameter(s)!",
        missingParams: errors.array(),
      });
    }

    try {
      creddy = await creddy;
      const data = await creddy.getCredential(req.body.credentialId);

      if (data != "" && data != null) {
        // const sig = await signWithECDSA(req.body.privateKey, data.body);
        let obj = { body: data.body };

        if (req.body.type == "issuer") {
          const issuer = JSON.parse(unAes(data.body.issuer));
          const sig = await signWithECDSA(
            req.body.privateKey,
            data.body,
            issuer.publicKey
          );
          if (sig == "Invalid signing key!")
            return res.status(400).json({ Error: sig });
          obj.issuerECDSA = sig;
        } else if (req.body.type == "learner") {
          const learner = JSON.parse(unAes(data.body.learner));
          obj.issuerECDSA = data.issuerECDSA;
          const sig = await signWithECDSA(
            req.body.privateKey,
            {
              body: data.body,
              issuerECDSA: data.issuerECDSA,
            },
            learner.publicKey
          );
          if (sig == "Invalid signing key!")
            return res.status(400).json({ Error: sig });
          obj.learnerECDSA = sig;
        } else if (req.body.type == "moe") {
          const moe = JSON.parse(unAes(data.body.moe));

          obj.issuerECDSA = data.issuerECDSA;
          obj.learnerECDSA = data.learnerECDSA;
          const sig = await signWithECDSA(
            req.body.privateKey,
            {
              body: data.body,
              issuerECDSA: data.issuerECDSA,
              learnerECDSA: data.learnerECDSA,
            },
            moe.publicKey
          );
          if (sig == "Invalid signing key!")
            return res.status(400).json({ Error: sig });

          obj.moeECDSA = sig;
        }
        const { txnId } = await createCredential(obj);
        return res.json({
          success: `Credential signed on the Blockchain!`,
          txnId: txnId,
          obj,
        });
      }

      return res.status(404).json({ Error: "Credential Not Found!" });
    } catch (error) {
      console.log("Sign Credential ECDSA Error: ", error);
      return res.status(500).json({ Error: "INTERNAL SERVER ERROR" });
    }
  }
);

route.post(
  "/verifyIssuerECDSA",
  [check("credentialId", "credential is required!").not().isEmpty()],
  auth,
  async (req, res) => {
    logger.logInfo({
      logType: `Verify ECDSA`,
      logTime: new Date().toString(),
    });
    const errors = validationResult(req);
    // console.log(req.body);
    if (!errors.isEmpty()) {
      console.log(errors.array());
      logger.logInfo({
        logType: "Institute ECDSA verification error | Missing Params",
        logTime: new Date().toString(),
        msg: `Missing parameters for ECDSA verification`,
        error: errors.array(),
      });
      return res.status(400).json({
        error: "Missing Parameter(s)!",
        missingParams: errors.array(),
      });
    }

    try {
      const data = await creddy.getCredential(req.body.credentialId);
      const issuer = JSON.parse(unAes(data.body.issuer));
      if (issuer.type == "ACCREDITED") {
        const verification = await creddy.verifyAccreditation(issuer);
        if (verification == false)
          return res.status(400).json({
            Error: "Institute Not Accredited - Verification Failed!",
          });

        const sigVerification = await verifyECDSA(
          data.issuerECDSA,
          issuer.publicKey,
          data.body
        );

        console.log("Sig Verification: " + sigVerification);

        if (sigVerification == true) {
          return res.status(200).json({
            success: `Institute Signature Verified using ECDSA!`,
          });
        } else {
          return res.status(400).json({
            Error: "Institute Signature Verification Failed using ECDSA!",
          });
        }
      }
      const sigVerification = verifyECDSA(
        data.issuerECDSA,
        issuer.publicKey,
        data.body
      );

      if (sigVerification == true)
        return res.status(200).json({
          success: `Institute Signature Verified using ECDSA!`,
        });

      return res.status(400).json({
        Error: "Institute Signature Verification Failed using ECDSA!",
      });
    } catch (error) {
      console.log("Institute Signature Verification Error: ", error);
      return res.status(500).json({ Error: "INTERNAL SERVER ERROR" });
    }
  }
);

route.post(
  "/verifyLearnerECDSA",
  [check("credentialId", "credentialId is required!").not().isEmpty()],
  auth,
  async (req, res) => {
    logger.logInfo({
      logType: `Verify Learner ECDSA`,
      logTime: new Date().toString(),
    });
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors.array());
      logger.logInfo({
        logType: "Learner ECDSA verification error | Missing Params",
        logTime: new Date().toString(),
        msg: `Missing parameters for ECDSA verification`,
        error: errors.array(),
      });
      return res.status(400).json({
        error: "Missing Parameter(s)!",
        missingParams: errors.array(),
      });
    }

    try {
      const data = await creddy.getCredential(req.body.credentialId);
      const learner = JSON.parse(unAes(data.body.learner));

      const sigVerification = await verifyECDSA(
        data.learnerECDSA,
        learner.publicKey,
        {
          body: data.body,
          issuerECDSA: data.issuerECDSA,
        }
      );

      if (sigVerification == true)
        return res.status(200).json({
          success: `Learner Signature Verified using ECDSA!`,
        });

      return res.status(400).json({
        Error: "Learner Signature Verification Failed using ECDSA!",
      });
    } catch (error) {
      console.log("Learner Signature Verification Error: ", error);
      return res.status(500).json({ Error: "INTERNAL SERVER ERROR" });
    }
  }
);

route.post(
  "/verifyMoeECDSA",
  [check("credentialId", "credentialId is required!").not().isEmpty()],
  auth,
  async (req, res) => {
    logger.logInfo({
      logType: `Verify ECDSA`,
      logTime: new Date().toString(),
    });
    const errors = validationResult(req);
    // console.log(req.body);
    if (!errors.isEmpty()) {
      console.log(errors.array());
      logger.logInfo({
        logType: "MoE ECDSA verification error | Missing Params",
        logTime: new Date().toString(),
        msg: `Missing parameters for ECDSA verification`,
        error: errors.array(),
      });
      return res.status(400).json({
        error: "Missing Parameter(s)!",
        missingParams: errors.array(),
      });
    }

    try {
      const data = await creddy.getCredential(req.body.credentialId);
      const moe = JSON.parse(unAes(data.body.moe));

      const sigVerification = await verifyECDSA(data.moeECDSA, moe.publicKey, {
        body: data.body,
        issuerECDSA: data.issuerECDSA,
        learnerECDSA: data.learnerECDSA,
      });

      if (sigVerification == true)
        return res.status(200).json({
          success: `MoE Signature Verified using ECDSA!`,
        });

      return res.status(400).json({
        Error: "MoE Signature Verification Failed using ECDSA!",
      });
    } catch (error) {
      console.log("MoE Signature Verification Error: ", error);
      return res.status(500).json({ Error: "INTERNAL SERVER ERROR" });
    }
  }
);

module.exports = route;
