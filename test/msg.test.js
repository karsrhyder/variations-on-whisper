const chai = require('chai') 
const expect = chai.expect;
const msg = require('../lib/msg') 
const sign = require('../lib/sign')
// web3.eth.accounts.privateKeyToAccount(privateKey);

describe('msg utility', () => {

    const privateKey = '0x348ce564d427a3311b6536bbcff9390d69395b06ed6c486954e971d960fe8709'
    const address = sign.getAddress(privateKey)

    describe('I\'m online msg', () => {
        it('should encode and decode an I\'m online msg', () => {
            // Create random data
            const chatPrivateKey = 'chat-secret'
            const recepientPubKey = '0x000acc7891011121314151617181920212223456'
    
            const payload = msg.online.encode(chatPrivateKey, recepientPubKey, privateKey)
            const {tsHex, signature} = msg.online.decode(payload)
            const _address = sign.recover(tsHex, signature)
            // Check that the signature is correct
            expect(address).to.equal(_address)
            // Check that the timestamp is recent
            expect(Date.now() - parseInt(tsHex, 16) < 2000).to.be.true
        });

        it('should authorize a valid message', () => {
            const chatPrivateKey = 'chat-secret'
            const payload = msg.online.encode(chatPrivateKey, address, privateKey)
            const authorized = msg.online.authorize(payload)
            expect(authorized).to.be.true
        })

        it('should not authorize a message with another address', () => {
            const chatPrivateKey = 'chat-secret'
            const recepientPubKey = '0x000acc7891011121314151617181920212223456'
            const payload = msg.online.encode(chatPrivateKey, recepientPubKey, privateKey)
            const authorized = msg.online.authorize(payload)
            expect(authorized).to.be.false
        })
    })

    describe('regular msg', () => {
        it('should encode and decode a regular msg', () => {
            // Create random data
            const chatPrivateKey = 'chat-secret'
            const recepientPubKey = '0x000acc7891011121314151617181920212223456'
            const cipher = 'secretData'
    
            const payload = msg.regular.encode(chatPrivateKey, recepientPubKey, cipher)
            const {cipher: _cipher} = msg.regular.decode(payload)
            // Check that the cipher is correct
            expect(cipher).to.equal(_cipher)
        });
    })
});