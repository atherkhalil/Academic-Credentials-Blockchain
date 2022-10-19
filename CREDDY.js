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
      let data = this.Credentials.filter((e) => e.body.id == id);
      data.reverse();
      return data[0];
    } catch (error) {
      return false;
    }
  }

  getCredentialHistory(id) {
    try {
      return this.Credentials.filter((e) => e.body.id == id);
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

  // Accreditation Methods
  accreditIssuer(info) {
    try {
      this.Accreditations.push(info);
      return true;
    } catch (error) {
      return false;
    }
  }

  verifyAccreditation(_issuer) {
    try {
      let issuer = this.Accreditations.filter((e) => e.id == _issuer.id);
      if (issuer[0].publicKey == _issuer.publicKey) {
        console.log(
          "Smart Contract Log: Accreditation verified for " + _issuer.id
        );
        console.log(issuer);
        return issuer[0].publicKey;
      }
      console.log(
        "Smart Contract Log: Accreditation NOT verified for " + _issuer.id
      );
      return false;
    } catch (error) {
      return false;
    }
  }

  getAccredited() {
    try {
      return this.Accreditations;
    } catch (error) {
      return false;
    }
  }
}
module.exports = CREDDY;
