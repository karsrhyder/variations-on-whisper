const Accounts = require('web3-eth-accounts');
const accounts = new Accounts('');

/**
 * @param {String} message Arbitrary data to sign. 
 * This data is before UTF-8 HEX decoded and enveloped as follows: 
 * "\x19Ethereum Signed Message:\n" + message.length + message
 * @param {String} privateKey The private key to sign with.
 * @return {String} Returns the field signature
 * {
 *      message: 'Some data',
 *      messageHash: '0x1da44b586eb0729ff70a73c326926f6ed5a25f5b056e7f47fbc6e58d86871655',
 *      v: '0x1c',
 *      r: '0xb91467e570a6466aa9e9876cbcd013baba02900b8979d43fe208a4a4f339f5fd',
 *      s: '0x6007e74cd82e037b800186422fc2da167c747ef045e5d18a5f5d4300f8e1a029',
 *      signature: '0xb91467e570a6466aa9e9876cbcd013baba02900b8979d43fe208a4a4f339f5fd6007e74cd82e037b800186422fc2da167c747ef045e5d18a5f5d4300f8e1a0291c'
 *  }
 */
function sign(message, privateKey) {
    return accounts.sign(message, privateKey).signature;
}

/**
 * 
 * @param {String} message Arbitrary data.
 * @param {String} signature Hex string.
 * @return {String} The signer address
 */
function recover(message, signature) {
    return accounts.recover(message, signature);
}

/**
 * 
 * @param {String} privateKey 
 * @return {String} Address
 */
function getAddress(privateKey) {
    return accounts.privateKeyToAccount(privateKey).address
}

module.exports = {
    sign,
    recover,
    getAddress
};
