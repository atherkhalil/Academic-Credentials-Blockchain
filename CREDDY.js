class CREDDY extends Jig {
  // Initialize Objects
  init() {
    this.Credentials = [];
    this.Accreditations = [];
  }

  // Credentials Methods
  createCredential(cred) {
    try {
      this.Credentials.push(cred);
      return true;
    } catch (error) {
      return false;
    }
  }

  getCredential(id) {
    try {
      let data = this.Credentials.filter((e) => e.credId == id);
      data.reverse();
      return data[0];
    } catch (error) {
      return false;
    }
  }

  getCredentialHistory(id) {
    try {
      return this.Credentials.filter((e) => e.credId == id);
    } catch (error) {
      return false;
    }
  }

  appendTxIdCredential(txnId) {
    try {
      this.Credentials[this.Credentials.length - 1].txnId = txnId;
      return true;
    } catch (error) {
      return false;
    }
  }
}
module.exports = CREDDY;
