const nacl = require('tweetnacl') 
const naclUtil = require('tweetnacl-util') 
nacl.util = naclUtil


// Must be a non-base 64 character.
// Base64 characters: "+" PLUS SIGN (U+002B), "/" SOLIDUS (U+002F) "=" EQUALS SIGN (U+003D) 
const SPLIT_CIPHER_CHAR = '.' // FULL STOP (U+002E)


function encrypt(messageString, keyEncoded) {
    // Compute vars
    const nonce = nacl.randomBytes(nacl.secretbox.nonceLength)
    const key = nacl.util.decodeBase64(keyEncoded)
    const messageBytes = nacl.util.decodeUTF8(messageString)

    // encrypt
    const box = nacl.secretbox(messageBytes, nonce, key)

    // Concat
    const nonceEncoded = nacl.util.encodeBase64( nonce )
    const cipherText = nacl.util.encodeBase64(box)
    return [nonceEncoded, cipherText].join(SPLIT_CIPHER_CHAR)
}


function decrypt(input, keyEncoded) {
    // compute vars
    const [nonceEncoded, cipherText] = input.split(SPLIT_CIPHER_CHAR)
    const key   = nacl.util.decodeBase64(keyEncoded)
    const nonce = nacl.util.decodeBase64(nonceEncoded)
    const box   = nacl.util.decodeBase64(cipherText)

    // decrypt
    const messageBytes = nacl.secretbox.open(box, nonce, key)
    return nacl.util.encodeUTF8(messageBytes)
}


function generateKeys() {
    return {
        id: nacl.util.encodeBase64( nacl.randomBytes(16) ),
        key: nacl.util.encodeBase64( nacl.randomBytes(nacl.secretbox.keyLength) )
    }
}


function generateKey() {
    return nacl.util.encodeBase64( nacl.randomBytes(nacl.secretbox.keyLength) )
}


module.exports = {
    encrypt,
    decrypt,
    generateKeys,
    generateKey
}
