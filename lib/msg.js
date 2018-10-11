const Web3Utils = require('web3-utils');
const {sign, recover} = require('./sign')

const sha3 = Web3Utils.sha3

// Must be a non-base64 character and not "." (FULL STOP (U+002E))
// Base64 characters: "+" PLUS SIGN (U+002B), "/" SOLIDUS (U+002F) "=" EQUALS SIGN (U+003D) 
const SPLIT_MSG_CHAR = '-' // HYPHEN-MINUS (U+002D)

function getHash(chatPrivateKey, yourAddress) {
    return sha3(sha3(chatPrivateKey) + yourAddress)
}

function hash(data) {
    return sha3(data)
}

function online() {
    function encode (chatPrivateKey, yourAddress, privateKey) {
        const hash = getHash(chatPrivateKey, yourAddress);
        const hashKey = sha3(chatPrivateKey);
        const tsHex = Date.now().toString(16);
        const signature = sign(tsHex, privateKey);
        return [hash, hashKey, tsHex, signature].join(SPLIT_MSG_CHAR)
    }
    function decode (payload) {
        const [hash, hashKey, tsHex, signature] = payload.split(SPLIT_MSG_CHAR)
        return {hash, hashKey, tsHex, signature}
    }
    function authorize (payload) {
        const {hash, hashKey, tsHex, signature} = decode(payload)
        const address = recover(tsHex, signature)
        return hash === sha3(hashKey + address);
    }
    return {
        encode,
        decode,
        authorize
    }
}

function regular() {
    function encode (chatPrivateKey, recepientAddress, cipher) {
        const hash = getHash(chatPrivateKey, recepientAddress);
        return [hash, cipher].join(SPLIT_MSG_CHAR)
    }
    function decode (payload) {
        const [hash, cipher] = payload.split(SPLIT_MSG_CHAR)
        return {hash, cipher}
    }
    return {
        encode,
        decode,
        getHash,
        hash
    }
}

module.exports = {
    online: online(),
    regular: regular()
};
