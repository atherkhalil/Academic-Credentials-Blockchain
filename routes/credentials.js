const express = require("express");
const route = express.Router();
const { check, validationResult } = require("express-validator");
let creddy = require("../app");
const { hash, aes, unAes } = require("../middleware/crypto");
const { Mutex } = require("async-mutex");
const mutex = new Mutex();
const { signWithECDSA, verifyECDSA } = require("../middleware/utils");
const auth = require("../middleware/auth");
const logger = require("../middleware/logger");

route.post(
  "/create",
  [
    check("credId", "credId is required!").not().isEmpty(),
    check("issuanceDate", "issuanceDate is required!").not().isEmpty(),
    check("type", "type is required!").not().isEmpty(),
    check("title", "title is required!").not().isEmpty(),
    check("description", "description is required!").not().isEmpty(),
    check("issuer", "issuer is required!").not().isEmpty(),
    check("student", "student is required!").not().isEmpty(),
    check("proof", "proof is required!").not().isEmpty(),
    check("board", "board lines must not be empty!").not().isEmpty(),
    check("equivalency", "equivalency is required!").not().isEmpty(),
  ],
  auth,
  async (req, res) => {
    console.log(`Credential Request: ${req.body.credId}`);
    logger.logInfo({
      logType: `Credential Creation Request: ${req.body.credId}`,
      logTime: new Date().toString(),
    });
    const errors = validationResult(req);
    // console.log(req.body);
    if (!errors.isEmpty()) {
      console.log(errors.array());
      logger.logInfo({
        logType: "Credential Creation Error | Missing Params",
        logTime: new Date().toString(),
        msg: `Missing parameters for Credential: ${req.body.credId}`,
        error: errors.array(),
      });
      return res.status(400).json({ error: "Missing Parameter(s)!" });
    }
    const release = await mutex.acquire();

    try {
      let obj = {
        txType: "Credential",
        credId: req.body.credId,
        issuanceDate: new Date(req.body.issuanceDate).valueOf(),
        type: aes(req.body.type),
        title: aes(req.body.title),
        description: aes(req.body.description),
        issuer: aes(JSON.stringify(req.body.issuer)),
        student: aes(JSON.stringify(req.body.student)),
        proof: aes(JSON.stringify(req.body.proof)),
        board: aes(req.body.board),
        equivalency: aes(req.body.equivalency),
        revokation: aes(JSON.stringify(req.body.revokation)),
        timeStamp: new Date(req.body.issuanceDate).valueOf(),
      };
      obj.txnHash = hash(obj);

      console.log("Credential '" + obj.credId + "' Hash => ", obj.txnHash);

      const { txnId, digest } = await createCredential(obj);
      console.log(
        `Credential ${obj.credId} created & signed by ${req.body.issuer.name} | TxnID: ${txnId}`
      );

      logger.logInfo({
        logType: "Credential Created",
        logTime: new Date().toString(),
        msg: `Credential ${req.body.credId} Created`,
        txnID: txnId,
        requestBody: req.body,
      });

      return res.json({
        success: `Credential '${req.body.credId}' posted to the Blockchain!`,
        txnId: txnId,
      });
    } catch (error) {
      console.log(`Credential ${req.body.credId} Creation Error: `, error);
      logger.logInfo({
        logType: "Credential Creation Error",
        logTime: new Date().toString(),
        msg: `Error while creating Credential ${req.body.credId}`,
        error: error.toString(),
      });
      return res.status(500).json({ error: "INTERNAL SERVER ERROR" });
    } finally {
      release();
    }
  }
);

route.get("/get/:id", auth, async (req, res) => {
  if (req.params.id == null || req.params.id.trim().length <= 0) {
    return res.status(400).json({ error: "credId is required!" });
  }

  try {
    creddy = await creddy;
    const data = creddy.getCredential(req.params.id);
    // console.log(data);
    if (data != "" && data != null) {
      // console.log(data);
      let response = {
        credId: data.credId,
        issuanceDate: new Date(data.issuanceDate).toUTCString(),

        type: unAes(data.type),
        title: unAes(data.title),
        description: unAes(data.description),
        issuer: JSON.parse(unAes(data.issuer)),
        student: JSON.parse(unAes(data.student)),
        proof: JSON.parse(unAes(data.proof)),
        board: unAes(data.board),
        equivalency: unAes(data.equivalency),
        revokation: JSON.parse(unAes(data.equivalency)),
        txnHash: data.txnHash,
        txType: data.txType,
        // TxnID: e.TxnID,
      };
      // console.log(response);
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
    return res.status(400).json({ error: "credId is required!" });
  }

  try {
    creddy = await creddy;
    const data = creddy.getCredentialHistory(req.params.id);
    // console.log("Credential Data", data);
    if (data != "" && data != null) {
      let response = [];
      data.map((e) => {
        let obj = {
          credId: e.credId,
          issuanceDate: new Date(e.issuanceDate).toUTCString(),
          type: unAes(e.type),
          title: unAes(e.title),
          description: unAes(e.description),
          issuer: JSON.parse(unAes(e.issuer)),
          student: JSON.parse(unAes(e.student)),
          proof: JSON.parse(unAes(e.proof)),
          board: unAes(e.board),
          equivalency: unAes(e.equivalency),
          revokation: JSON.parse(unAes(e.equivalency)),
          txnHash: e.txnHash,
          txType: e.txType,
          txnHash: e.txnHash,
          // TxnID: e.TxnID,
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
    check("credential", "Credential object is required!").not().isEmpty(),
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
      return res.status(400).json({ error: "Missing Parameter(s)!" });
    }

    try {
      creddy = await creddy;
      const data = creddy.getCredential(req.body.credential.credId);

      if (data != "" && data != null) {
        const sig = signWithECDSA(req.body.privateKey, req.body.credential);

        data.instituteECDSA = sig;
        const { txnId } = await createCredential(obj);
        return res.json({
          success: `Credential signed on the Blockchain!`,
          txnId: txnId,
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
  "/verifyInstituteECDSA",
  [
    check("signature", "signature object is required!").not().isEmpty(),
    check("publicKey", "publicKey object is required!").not().isEmpty(),
    check("credential", "credential is required!").not().isEmpty(),
  ],
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
      return res.status(400).json({ error: "Missing Parameter(s)!" });
    }

    try {
      const sigVerification = verifyECDSA(
        req.body.credential.instituteECDSA,
        req.body.publicKey,
        req.body.credential.body
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
  "/verifyStudentECDSA",
  [
    check("signature", "signature object is required!").not().isEmpty(),
    check("publicKey", "publicKey object is required!").not().isEmpty(),
    check("credential", "credential is required!").not().isEmpty(),
  ],
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
        logType: "Student ECDSA verification error | Missing Params",
        logTime: new Date().toString(),
        msg: `Missing parameters for ECDSA verification`,
        error: errors.array(),
      });
      return res.status(400).json({ error: "Missing Parameter(s)!" });
    }

    try {
      const sigVerification = verifyECDSA(
        req.body.credential.studentECDSA,
        req.body.publicKey,
        {
          body: req.body.credential.body,
          instituteECDSA: req.body.credential.instituteECDSA,
          studentECDSA: req.body.credential.studentECDSA,
        }
      );

      if (sigVerification == true)
        return res.status(200).json({
          success: `Student Signature Verified using ECDSA!`,
        });

      return res.status(400).json({
        Error: "Student Signature Verification Failed using ECDSA!",
      });
    } catch (error) {
      console.log("Student Signature Verification Error: ", error);
      return res.status(500).json({ Error: "INTERNAL SERVER ERROR" });
    }
  }
);

route.post(
  "/verifyMoeECDSA",
  [
    check("signature", "signature object is required!").not().isEmpty(),
    check("publicKey", "publicKey object is required!").not().isEmpty(),
    check("credential", "credential is required!").not().isEmpty(),
  ],
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
      return res.status(400).json({ error: "Missing Parameter(s)!" });
    }

    try {
      const sigVerification = verifyECDSA(
        req.body.credential.moeECDSA,
        req.body.publicKey,
        {
          body: req.body.credential.body,
          instituteECDSA: req.body.credential.instituteECDSA,
          studentECDSA: req.body.credential.studentECDSA,
          moeECDSA: req.body.credential.moeECDSA,
        }
      );

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
