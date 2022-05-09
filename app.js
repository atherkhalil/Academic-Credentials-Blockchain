const express = require("express");
const Run = require("run-sdk");
const CONTRACT = require("./CREDDY");
const logger = require("./middleware/logger");
// Using 'Express' methods
const app = express();
app.use(express.json({ extended: true }));
require("dotenv").config();

app.use((req, res, next) => {
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Credentials", true);
  next();
});

let location = "";
let origin = "";

const initialize = async () => {
  try {
    const run = new Run({
      network: "mock",
      // cache: new Firestore("mock"),
      // owner: process.env.OWNER,
      // purse: process.env.PURSE,
      debug: false,
      logger: null,
      trust: "*",
      networkRetries: 10,
      networkTimeout: 100000000,
      timeout: 100000000,
      // api: "whatsonchain",
      // api: "run",
      // api: "mattercloud",
    });

    // const contract = await run.load(
    //   "a13ab52420c2eb4644307b15e074d0e2ac1d8bb21c441998b6289b9da5240b0a_o2"
    // );

    const contract = new CONTRACT();

    console.log("Purse PrivKey: ", run.purse.privkey);
    console.log("Purse Address: ", run.purse.address);

    console.log("Owner PrivKey: ", run.owner.privkey);
    console.log("Owner Address: ", run.owner.address);

    await contract.sync();

    console.log("\n/***** Creddy SmartContract Initialized! *****/\n");
    // console.log(contract);
    console.log("Origin: ", contract.origin);
    console.log("Location: ", contract.location, "\n");
    location = contract.location;
    origin = contract.origin;
    return contract;
  } catch (error) {
    console.log(error);
  }
};

// Exporting CREDDY Smart Contract
module.exports = initialize();

app.get("/", (req, res) => {
  return res.json({
    Alert: "You are NOT AUTHORIZED! Please leave imidiately.",
  });
});

app.use("/cred", require("./routes/credentials"));
app.use("/keys", require("./routes/keys"));
app.use("/search", require("./routes/search"));

app.get("/meta", (req, res) => {
  return res.send(`Loc: ${location} \n Org: ${origin}`);
});

// Log Route
app.get("/logs/:limit", (req, res) => {
  return res.send(
    logger.log.slice(
      parseInt(
        logger.log.length - (req.params.limit || 10) > 0
          ? logger.log.length - (req.params.limit || 10)
          : 0
      ),
      logger.log.length
    )
  );
});

app.listen(
  process.env.PORT,
  console.log(`🚀 at http://localhost:${process.env.PORT}`)
);
