const express = require("express");
const route = express.Router();
let creddy = require("../app");
const { hash, aes, unAes } = require("../middleware/crypto");
const auth = require("../middleware/auth");

// route.get("/txnId/:id", auth, async (req, res) => {
//   if (req.params.id == null || req.params.id.trim().length <= 0) {
//     return res.status(400).json({ error: "TxnID is required!" });
//   }

//   try {
//     imlite = await creddy
//     let txns = [
//       ...rm.Invoices,
//       ...rm.Payments
//     ];

//     let txnLength = txns.length;
//     let i = 0;
//     let t;
//     while (i < txnLength) {
//       txns[i].TxnID.toString() === req.params.id.toString()
//         ? (t = txns[i])
//         : null;
//       i++;
//     }

//     if (t != null && t != "" && t != {} && t != []) {
//       // console.log("Transaction found => ", t);
//       let obj = {};
//       for (let [key, value] of Object.entries(t)) {
//         // console.log(key, ": ", value);
//         if (key != "ID" && key != "TxnID")
//           obj[key] = value ? unAes(value) : "noVal";
//       }
//       t.TxnID != null ? (obj.TxnID = t.TxnID.toString()) : (obj.TxnID = "none");

//       obj.TxnHash = hash(t);
//       // console.log("OBJ: ", obj);

//       return res.status(200).send(obj);
//     }
//     return res.status(404).send("Transaction Not Found");
//   } catch (error) {
//     console.log("Search Error: ", error);
//     return res.status(500).json({ Error: "INTERNAL SERVER ERROR" });
//   }
// });

route.get("/txnHash/:hash", auth, async (req, res) => {
  if (req.params.hash == null || req.params.hash.trim().length <= 0) {
    return res.status(400).json({ error: "TxnHash is required!" });
  }

  try {
    im = await creddy;
    let txns = [...im.Invoices, ...im.Payments];

    let txnLength = txns.length;
    let i = 0;
    let t;
    while (i < txnLength) {
      txns[i].txnHash == req.params.hash ? (t = txns[i]) : null;
      i++;
    }

    if (t != null && t != "" && t != {} && t != []) {
      // console.log("Transaction by TS found => ", t);
      let obj = {};
      for (let [key, value] of Object.entries(t)) {
        // console.log(key, ": ", value);
        if (t.type == "Invoice") {
          if (
            key == "vendorEmail" ||
            key == "vendorName" ||
            key == "clientEmail" ||
            key == "clientName" ||
            key == "currency" ||
            key == "fundReception" ||
            key == "lines" ||
            key == "netAmt"
          ) {
            obj[key] = value ? unAes(value) : "noVal";
          } else {
            obj[key] = value;
          }
        }

        if (t.type == "InvoicePayment") {
          if (
            key == "vendorId" ||
            key == "currencyCode" ||
            key == "paidAmount" ||
            key == "paymentType" ||
            key == "receiptUrl" ||
            key == "paymentGateway"
          ) {
            obj[key] = value ? unAes(value) : "noVal";
          } else {
            obj[key] = value;
          }
        }
      }
      t.TxnID != null ? (obj.TxnID = t.TxnID.toString()) : (obj.TxnID = "none");

      // console.log("OBJ: ", obj);

      return res.status(200).send(obj);
    }

    return res.status(404).send("Transaction Not Found");
  } catch (error) {
    console.log("Tx By Hash Error: ", error);
    return res.status(500).json({ Error: "INTERNAL SERVER ERROR" });
  }
});

route.get("/timeStamp/:ts", auth, async (req, res) => {
  // if (req.params.ts == null || req.params.ts.trim().length <= 0) {
  //   return res.status(400).json({ error: "TimeStamp is required!" });
  // }
  console.log(new Date(req.params.ts).toUTCString());

  try {
    im = await creddy;
    let txns = [...im.Invoices, ...im.Payments];

    let txnLength = txns.length;
    let i = 0;
    let t;
    while (i < txnLength) {
      console.log(new Date(txns[i].timeStamp).toUTCString());
      new Date(txns[i].timeStamp).toUTCString() ==
      new Date(req.params.ts).toUTCString()
        ? (t = txns[i])
        : null;
      i++;
    }

    if (t != null && t != "" && t != {} && t != []) {
      // console.log("Transaction by TS found => ", t);
      let obj = {};
      for (let [key, value] of Object.entries(t)) {
        // console.log(key, ": ", value);
        if (t.type == "Invoice") {
          if (
            key == "vendorEmail" ||
            key == "vendorName" ||
            key == "clientEmail" ||
            key == "clientName" ||
            key == "currency" ||
            key == "fundReception" ||
            key == "lines" ||
            key == "netAmt"
          ) {
            obj[key] = value ? unAes(value) : "noVal";
          } else {
            obj[key] = value;
          }
        }

        if (t.type == "InvoicePayment") {
          if (
            key == "vendorId" ||
            key == "currencyCode" ||
            key == "paidAmount" ||
            key == "paymentType" ||
            key == "receiptUrl" ||
            key == "paymentGateway"
          ) {
            obj[key] = value ? unAes(value) : "noVal";
          } else {
            obj[key] = value;
          }
        }
      }
      t.TxnID != null ? (obj.TxnID = t.TxnID.toString()) : (obj.TxnID = "none");

      // console.log("OBJ: ", obj);

      return res.status(200).send(obj);
    }

    return res.status(404).send("Transaction Not Found");
  } catch (error) {
    console.log("TimeStamp Search Error: ", error);
    return res.status(500).json({ Error: "INTERNAL SERVER ERROR" });
  }
});

route.get("/everything", auth, async (req, res) => {
  try {
    im = await creddy;
    let txns = [...im.Invoices, ...im.Payments];
    // let all = [];
    // let txnLength = txns.length;
    // let i = 0;
    // while (i < txnLength) {
    //   let obj = {};
    //   // console.log(e);
    //   for (let [key, value] of Object.entries(txns[i])) {
    //     // console.log(key, ": ", value);
    //     if (txns[i].type == "Invoice") {
    //       if (
    //         key == "vendorEmail" ||
    //         key == "vendorName" ||
    //         key == "clientEmail" ||
    //         key == "clientName" ||
    //         key == "currency" ||
    //         key == "fundReception" ||
    //         key == "lines" ||
    //         key == "netAmt"
    //       ) {
    //         obj[key] = value ? unAes(value) : "noVal";
    //       }
    //     }

    //     if (txns[i].type == "InvoicePayment") {
    //       if (
    //         key == "vendorId" ||
    //         key == "currencyCode" ||
    //         key == "paidAmount" ||
    //         key == "paymentType" ||
    //         key == "receiptUrl" ||
    //         key == "paymentGateway"
    //       ) {
    //         obj[key] = value ? unAes(value) : "noVal";
    //       }
    //     }
    //   }
    //   // console.log("obj => ", obj);
    //   txns[i].TxnID != null
    //     ? (obj.TxnID = txns[i].TxnID.toString())
    //     : (obj.TxnID = "none");
    //   // console.log("obj.TxnID => ", obj.TxnID);
    //   obj.txnHash = hash(txns[i].hash);
    //   // console.log("OBJ: ", obj);
    //   all.push(obj);

    //   i++;
    // }

    return res.status(200).send(txns);
  } catch (error) {
    console.log("Everything Error: ", error);
    return res.status(500).json({ Error: "INTERNAL SERVER ERROR" });
  }
});

route.post("/paginated", auth, async (req, res) => {
  try {
    im = await creddy;
    let txns = [...im.Invoices, ...im.Payments];
    // let all = [];
    // let txnLength = txns.length;
    // let i = 0;
    // while (i < txnLength) {
    //   let obj = {};
    //   // console.log(e);
    //   for (let [key, value] of Object.entries(txns[i])) {
    //     // console.log(key, ": ", value);
    //     if (txns[i].type == "Invoice") {
    //       if (
    //         key == "vendorEmail" ||
    //         key == "vendorName" ||
    //         key == "clientEmail" ||
    //         key == "clientName" ||
    //         key == "currency" ||
    //         key == "fundReception" ||
    //         key == "lines" ||
    //         key == "netAmt"
    //       ) {
    //         obj[key] = value ? unAes(value) : "noVal";
    //       }
    //     }

    //     if (txns[i].type == "InvoicePayment") {
    //       if (
    //         key == "vendorId" ||
    //         key == "currencyCode" ||
    //         key == "paidAmount" ||
    //         key == "paymentType" ||
    //         key == "receiptUrl" ||
    //         key == "paymentGateway"
    //       ) {
    //         obj[key] = value ? unAes(value) : "noVal";
    //       }
    //     }
    //   }
    //   // console.log("obj => ", obj);
    //   txns[i].TxnID != null
    //     ? (obj.TxnID = txns[i].TxnID.toString())
    //     : (obj.TxnID = "none");
    //   // console.log("obj.TxnID => ", obj.TxnID);
    //   obj.txnHash = hash(txns[i].hash);
    //   // console.log("OBJ: ", obj);
    //   all.push(obj);

    //   i++;
    // }

    txns.sort((x, y) => {
      return parseInt(y.timeStamp) - parseInt(x.timeStamp);
    });
    // return all.slice(2, 6);
    return res.status(200).send(txns.slice(req.body.offset, req.body.limit));
  } catch (error) {
    console.log("PaginatedEverything Error: ", error);
    return res.status(500).json({ Error: "INTERNAL SERVER ERROR" });
  }
});

route.post("/type", auth, async (req, res) => {
  try {
    im = await creddy;
    switch (req.body.type) {
      case "Invoice": {
        let all = [...im.Invoices];
        all.sort((x, y) => {
          return parseInt(y.timeStamp) - parseInt(x.timeStamp);
        });
        // return all.slice(2, 6);

        return res.status(200).send(all.slice(req.body.offset, req.body.limit));
      }
      case "InvoicePayment": {
        let all = [...im.Payments];
        all.sort((x, y) => {
          return parseInt(y.timeStamp) - parseInt(x.timeStamp);
        });
        // return all.slice(2, 6);

        return res.status(200).send(all.slice(req.body.offset, req.body.limit));
      }

      default: {
        return res.status(404).send("Not Found");
      }
    }
    // return res.status(404).send("Not Found");
  } catch (error) {
    console.log("Get Tx By Type Error: ", error);
    return res.status(500).json({ Error: "INTERNAL SERVER ERROR" });
  }
});

route.get("/lil-kpi", async (req, res) => {
  try {
    im = await creddy;
    let txns = [...im.Invoices, ...im.Payments];

    const bytes = Buffer.byteLength(JSON.stringify(txns));
    // const bytes = getSizeInBytes(obj);
    let kB = bytes / 1024;
    kB = Math.round(kB * 100) / 100;

    return res.status(200).json({
      totalTxns: txns.length,
      totalData: kB,
      Invoices: im.Invoices.length,
      Payments: im.Payments.length,
    });
  } catch (error) {
    console.log("LIL KPI ERROR => ", error);
    return res.status(500).send("INTERNAL SERVER ERROR");
  }
});

module.exports = route;
