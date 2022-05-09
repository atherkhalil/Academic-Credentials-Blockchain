const CryptoJS = require("crypto-js");

const hash = (data) => {
  try {
    // data = Object.keys(data)
    //   .sort()
    //   .reduce((obj, key) => {
    //     obj[key] = data[key];
    //     return obj;
    //   }, {});
    data = JSON.stringify(data);

    // console.log("Hash Payload => ", JSON.stringify(ordered));
    const digest = CryptoJS.SHA256(data).toString();
    // console.log("Digest => ", digest);
    return digest;
  } catch (error) {
    console.log("HASHING ERROR => ", error);
    return error;
  }
};

const aes = (data) => {
  try {
    return CryptoJS.AES.encrypt(data, process.env.AES_KEY).toString();
  } catch (error) {
    console.log("ENCRYPTION ERROR => ", error);
    return error;
  }
};

const unAes = (data) => {
  try {
    const decrypted = CryptoJS.AES.decrypt(data, process.env.AES_KEY);
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.log("DECRYPTION ERROR => ", error);
    return error;
  }
};

module.exports = {
  hash: hash,
  aes: aes,
  unAes: unAes,
};
