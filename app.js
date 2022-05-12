const express = require("express");
const Run = require("run-sdk");
// const CONTRACT = require("./CREDDY");
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
      network: "test",
      // cache: new Firestore("mock"),
      owner: process.env.OWNER,
      purse: process.env.PURSE,
      debug: false,
      logger: null,
      trust: "*",
      networkRetries: 10,
      networkTimeout: 100000000,
      timeout: 100000000,
      // api: "whatsonchain",
      api: "run",
      // api: "mattercloud",
    });

    // Origin:  1e45e11736e5ee47747468cd6ab5d3663b17078a5e3013b97cede2824a482cfd_o2
    // Location:  1e45e11736e5ee47747468cd6ab5d3663b17078a5e3013b97cede2824a482cfd_o2

    const contract = await run.load(
      "cf51b11c3fb7e52fe4ff0da2c151c642f41a1f4f05e871701ca07d0a27ea9642_o2"
    );

    // const contract = new CONTRACT();

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

app.use("/credentialS", require("./routes/credentials"));
app.use("/accreditationS", require("./routes/accreditations"));
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
  console.log(
    `🚀 at http://localhost:${process.env.PORT} \n ${new Date().toUTCString()}`
  )
);
