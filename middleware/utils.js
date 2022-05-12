const { Mutex } = require("async-mutex");
const mutex = new Mutex();
let creddy = require("../app");
let { hash } = require("./crypto");
const nimble = require("@runonbitcoin/nimble");

nimble.testnet = true;

const createCredential = async (params) => {
  const release = await mutex.acquire();
  creddy = await creddy;

  try {
    creddy.createCredential(params);

    await creddy.sync();
    // console.log("Location_1: ", creddy.location.slice(0, -3));

    const txnId = creddy.location.slice(0, -3);
    // creddy.appendTxIdCredential(txnId);
    // await creddy.sync();
    // console.log("Location_2: ", creddy.location.slice(0, -3));

    return { txnId, digest: hash(params) };
  } catch (error) {
    console.log("Create Credential Error: ", error);
    return error;
  } finally {
    release();
  }
};

const signWithECDSA = async (_privateKey, _data, _matchPubKey) => {
  try {
    // Convert to PrivateKey object
    const privateKey = nimble.PrivateKey.fromString(_privateKey);

    console.log("PrivKey: ", privateKey.toString());
    console.log("PubKey: ", privateKey.toPublicKey().toString());

    // Match the pubKey in the credential with the signing pubKey
    if (_matchPubKey != privateKey.toPublicKey().toString()) {
      console.log("Invalid signing key!");
      throw "Invalid signing key!";
    }

    // Sign with ECDSA
    let data = nimble.functions.sha256(JSON.stringify(_data));

    const signed = nimble.functions.ecdsaSign(
      data,
      privateKey.number,
      privateKey.toPublicKey().point
    );

    const signature = {
      signingDate: new Date().toUTCString(),
      r: nimble.functions.encodeHex(signed.r),
      s: nimble.functions.encodeHex(signed.s),
      k: nimble.functions.encodeHex(signed.k),
    };
    // console.log(signature);
    return signature;
  } catch (error) {
    console.log("Sign With ECDSA Error: ", error);
    return error;
  }
};

const verifyECDSA = async (_signature, _publicKey, _data) => {
  try {
    const verifySignature = nimble.functions.ecdsaVerify(
      {
        r: nimble.functions.decodeHex(_signature.r),
        s: nimble.functions.decodeHex(_signature.s),
        k: nimble.functions.decodeHex(_signature.k),
      },
      nimble.functions.sha256(JSON.stringify(_data)),
      nimble.functions.decodePublicKey(nimble.functions.decodeHex(_publicKey))
    );

    // console.log(verifySignature);

    return verifySignature;
  } catch (error) {
    console.log("Verify ECDSA Signature Error: ", error);
    return error;
  }
};

module.exports = {
  createCredential,
  signWithECDSA,
  verifyECDSA,
};
