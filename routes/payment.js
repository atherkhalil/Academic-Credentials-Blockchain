const express = require("express");
const route = express.Router();
const { check, validationResult } = require("express-validator");
let creddy = require("../app");
const { hash, aes, unAes } = require("../middleware/crypto");
const { Mutex } = require("async-mutex");
const mutex = new Mutex();
const { invoicePayment } = require("../middleware/utils");
const auth = require("../middleware/auth");
const logger = require("../middleware/logger");
const gql = require("../middleware/gql");

route.get("/get-all", auth, async (req, res) => {
  try {
    creddy = await creddy;
    let IN = [];
    creddy.Payments.forEach((element) => {
      let obj = {};
      for (let [key, value] of Object.entries(element)) {
        if (key != "ID" && key != "TxnID")
          obj[key] = value ? unAes(value) : "noVal";
      }
      // obj.TxnID = t.TxnID.toString();
      // console.log("OBJ: ", obj);

      IN.push(obj);
    });
    // console.log("All Invoices: ", IN.length);
    return res.status(200).send(IN);
  } catch (error) {
    console.log("Get all InvoicePayments Error: ", error);
    return res.status(500).json({
      error: "Couldn't fetch InvoicePayments. Please try again!",
    });
  }
});

route.post(
  "/create",
  [
    check("invoiceId", "invoiceId is required!").not().isEmpty(),
    check("paymentID", "paymentID is required!").not().isEmpty(),
    check("vendorId", "vendorId is required!").not().isEmpty(),
    check("currencyCode", "currencyCode is required!").not().isEmpty(),
    check("paidAmount", "paidAmount is required!").not().isEmpty(),
    check("paymentType", "paymentType is required!").not().isEmpty(),
    check("receiptUrl", "receiptUrl is required!").not().isEmpty(),
    check("date", "date is required!").not().isEmpty(),
    check("paymentGateway", "paymentGateway is required!").not().isEmpty(),
  ],
  auth,
  async (req, res) => {
    console.log(`InvoicePayment Request: ${req.body.invoiceId}`);
    logger.logInfo({
      logType: `InvoicePayment Creation Request: ${req.body.invoiceId}`,
      logTime: new Date().toString(),
    });
    const errors = validationResult(req);
    // console.log(req.body);
    if (!errors.isEmpty()) {
      console.log("InvoicePayment MISSING PARAMETERS => \n", errors.array());
      logger.logInfo({
        logType: "InvoicePayment Creation Error | Missing Params",
        logTime: new Date().toString(),
        msg: `Missing parameters for InvoicePayment: ${req.body.invoiceId}`,
        error: errors.array(),
      });
      return res.status(400).json({ error: "Missing Parameter(s)!" });
    }
    const release = await mutex.acquire();

    try {
      let obj = {
        type: "InvoicePayment",
        invoiceId: req.body.invoiceId,
        paymentID: req.body.paymentID,
        vendorId: aes(req.body.vendorId),
        currencyCode: aes(req.body.currencyCode),
        paidAmount: aes(req.body.paidAmount.toString()),
        paymentType: aes(req.body.paymentType),
        receiptUrl: aes(req.body.receiptUrl),
        date: new Date(req.body.date).valueOf(),
        paymentGateway: aes(req.body.paymentGateway),
        timeStamp: new Date(req.body.date).valueOf(),
      };
      obj.txnHash = hash(obj);

      console.log(
        "InvoicePayment '" + obj.paymentID + "' Hash => ",
        obj.txnHash
      );

      const { txnId, digest } = await invoicePayment(obj);
      console.log(
        `InvoicePayment for invoice: ${obj.invoiceId} posted to BSV | TxnID: ${txnId}`
      );

      await gql(
        `newPayment(
          type: \"${obj.type.toString()}\",
          invoiceId: \"${req.body.invoiceId.toString()}\",
          paymentID: \"${obj.paymentID.toString()}\",
          vendorId: \"${req.body.vendorId.toString()}\",
          currencyCode: \"${req.body.currencyCode.toString()}\",
          paidAmount: \"${req.body.paidAmount.toString()}\",
          paymentType: \"${req.body.paymentType.toString()}\",
          receiptUrl: \"${req.body.receiptUrl.toString()}\",
          date: \"${obj.date.toString()}\",
          paymentGateway: \"${req.body.paymentGateway.toString()}\",
          txnHash: \"${obj.txnHash.toString()}\"
        )`
      );

      logger.logInfo({
        logType: "InvoicePayment Created",
        logTime: new Date().toString(),
        msg: `InvoicePayment ${req.body.paymentID} for ${req.body.invoiceId} Created`,
        txnID: txnId,
        requestBody: req.body,
      });

      return res.json({
        success: `InvoicePayment ${req.body.paymentID} for '${req.body.invoiceId}' posted to the Blockchain!`,
        txnId: txnId,
      });
    } catch (error) {
      console.log(
        `InvoicePayment ${req.body.paymentID} for ${req.body.invoiceId} Creation Error: `,
        error
      );
      logger.logInfo({
        logType: "InvoicePayment Creation Error",
        logTime: new Date().toString(),
        msg: `Error while creating InvoicePayment ${req.body.paymentID} for ${req.body.invoiceId}`,
        error: error.toString(),
      });
      return res.status(500).json({ error: "INTERNAL SERVER ERROR" });
    } finally {
      release();
    }
  }
);

route.get("/by-invoice/:id", auth, async (req, res) => {
  if (req.params.id == null || req.params.id.trim().length <= 0) {
    return res.status(400).json({ error: "invoiceId is required!" });
  }

  try {
    creddy = await creddy;
    const data = creddy.getPaymentByInvoiceId(req.params.id);
    // console.log(data);
    if (data != "" && data != null) {
      // console.log(data);
      let response = {
        invoiceId: data.invoiceId,
        paymentID: data.paymentID,
        vendorId: unAes(data.vendorId),
        currencyCode: unAes(data.currencyCode),
        paidAmount: unAes(data.paidAmount),
        paymentType: unAes(data.paymentType),
        receiptUrl: unAes(data.receiptUrl),
        date: new Date(data.date).toUTCString(),
        paymentGateway: unAes(data.paymentGateway),
        txnHash: data.txnHash,
        type: data.type,
        // TxnID: e.TxnID,
      };
      // console.log(response);
      return res.status(200).send(response);
    }
    return res.status(404).json({ Error: "InvoicePayment Not Found!" });
  } catch (error) {
    console.log("InvoicePayment Get BY InvoiceId Error: ", error);
    return res.status(500).json({ Error: "INTERNAL SERVER ERROR" });
  }
});

route.get("/by-payment/:id", auth, async (req, res) => {
  if (req.params.id == null || req.params.id.trim().length <= 0) {
    return res.status(400).json({ error: "paymentId is required!" });
  }

  try {
    creddy = await creddy;
    const data = creddy.getPaymentByPaymentId(req.params.id);
    // console.log(data);
    if (data != "" && data != null) {
      // console.log(data);
      let response = {
        invoiceId: data.invoiceId,
        paymentID: data.paymentID,
        vendorId: unAes(data.vendorId),
        currencyCode: unAes(data.currencyCode),
        paidAmount: unAes(data.paidAmount),
        paymentType: unAes(data.paymentType),
        receiptUrl: unAes(data.receiptUrl),
        date: new Date(data.date).toUTCString(),
        paymentGateway: unAes(data.paymentGateway),
        txnHash: data.txnHash,
        type: data.type,
        // TxnID: e.TxnID,
      };
      // console.log(response);
      return res.status(200).send(response);
    }
    return res.status(404).json({ Error: "InvoicePayment Not Found!" });
  } catch (error) {
    console.log("InvoicePayment Get BY PaymentId Error: ", error);
    return res.status(500).json({ Error: "INTERNAL SERVER ERROR" });
  }
});

route.get("/history/:id", auth, async (req, res) => {
  if (req.params.id == null || req.params.id.trim().length <= 0) {
    return res.status(400).json({ error: "invoiceId is required!" });
  }

  try {
    creddy = await creddy;
    const data = creddy.getPaymentHistory(req.params.id);
    // console.log("InvoicePayment Data", data);
    if (data != "" && data != null) {
      let response = [];
      data.map((e) => {
        let obj = {
          invoiceId: e.invoiceId,
          paymentID: e.paymentID,
          vendorId: unAes(e.vendorId),
          currencyCode: unAes(e.currencyCode),
          paidAmount: unAes(e.paidAmount),
          paymentType: unAes(e.paymentType),
          receiptUrl: unAes(e.receiptUrl),
          date: new Date(e.date).toUTCString(),
          paymentGateway: unAes(e.paymentGateway),
          txnHash: e.txnHash,
          type: e.type,
          // TxnID: e.TxnID,
        };
        response.push(obj);
      });
      return res.status(200).send(response);
    }
    return res.status(404).json({ Error: "InvoicePayment Not Found!" });
  } catch (error) {
    console.log("InvoicePayment History Error: ", error);
    return res.status(500).json({ Error: "INTERNAL SERVER ERROR" });
  }
});

module.exports = route;
