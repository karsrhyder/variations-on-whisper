const chai = require('chai') 
const expect = chai.expect;
const crypt = require('../lib/crypt') 

describe('crypt utility', () => {

    const key = crypt.generateKey()

    it('should encrypt/decrypt and return the original message', () => {
      // Create random data
      const data = 'sample data'
      const val = crypt.encrypt(data, key)
      const returnedData = crypt.decrypt(val, key)
      expect(data).to.equal(returnedData)
    });
});