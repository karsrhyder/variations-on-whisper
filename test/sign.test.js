const chai = require('chai') 
const expect = chai.expect;
const sign = require('../lib/sign') 
// web3.eth.accounts.privateKeyToAccount(privateKey);

describe('sign/recover utility', () => {

    const privateKey = '0x348ce564d427a3311b6536bbcff9390d69395b06ed6c486954e971d960fe8709'

    it('should sign a msg', async () => { 
        const data = 'Oh hi mark'
        const signature = sign.sign(data, privateKey)
        const _address = sign.recover(data, signature)
        const address = sign.getAddress(privateKey)
        expect(address).to.deep.equal(_address)
    });
});