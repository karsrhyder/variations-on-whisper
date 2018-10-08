const EventEmitter = require('events');
const colors = require('colors');
const btoa = require('btoa');
const nacl = require('tweetnacl');
const naclUtil = require('tweetnacl-util');
nacl.util = naclUtil;

let web3;
let dappSym;

class Gossip extends EventEmitter {
    constructor() {
        super();
    }

    // Initialize the library
    async init(_web3) {
        console.clear();
        console.log("Gossip - Whisper".yellow);
        web3 = _web3;
        dappSym = '0ae647d91375eb3ae4ee06e77ae6710eb42f81018edc14791c4ab1c5a7120a8e';
        //dappSym = await web3.shh.generateSymKeyFromPassword('swarmcity1');
        let Id = await web3.shh.addSymKey('0x'+dappSym);
        let hasit = await web3.shh.hasSymKey(dappSym);
        console.log(colors.blue('Initializing: \n', 'DappSym: ', dappSym, '\n Id: ', Id, '\n Exists on node: ', hasit));
        return dappSym;
    };

    async subscribe(_dappSymKeyId, _secret) {
        // Subscribe function 
        var self = this;
        web3.shh.newMessageFilter({
            symKeyID: _dappSymKeyId,
            topics: ['0x00000001'],
            ttl: 20,
            minPow: 0.8,
        }).then(_Id => {
            setInterval(() => web3.shh.getFilterMessages(_Id).then(msgs => {
                if (!msgs.length) return 
                msgs.forEach(m => {
                    const decodePayload = web3.utils.hexToUtf8(m.payload);
                    this.unHash(decodePayload).then((res) => {
                        //if (hash === hashOfInterest) {
                            this.decrypt(_secret, res[1], res[2]).then((res) => {
                                this.emit('message', res, m.sig);
                            });
                        //}
                    });
                })
            }), 1000)
        });
    };

    getDappSym() {
        return dappSym;
    };

    async unHash(_hash) {
        return _hash.split(".");
    };

    /* Encrypt the payload */
    async encrypt(_from, _to, _message, _secret) {
        const hash = web3.utils.sha3(web3.utils.sha3(_from.privateKey) + _to.publicKey);
        const messageString = _message;
        const keyEncoded = _secret;
        const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
        const key = nacl.util.decodeBase64(keyEncoded);
        const messageBytes = nacl.util.decodeUTF8(messageString);
        const box = nacl.secretbox(messageBytes, nonce, key);
        const nonceEncoded = nacl.util.encodeBase64(nonce);
        const cypherText = nacl.util.encodeBase64(box);
        //console.log(`${hash}.${nonceEncoded}.${cypherText}`);
        return (`${hash}.${nonceEncoded}.${cypherText}`);
    };

    /* Decrypt the payload */
    async decrypt(_secret,_nonceEncoded,_cypherText) {
        const key =  nacl.util.decodeBase64(_secret);
        const nonce =  nacl.util.decodeBase64(_nonceEncoded);
        const box =  nacl.util.decodeBase64(_cypherText);
        const messageBytes =  nacl.secretbox.open(box, nonce, key);
        const msg =  nacl.util.encodeUTF8(messageBytes);
        return msg;
    };

    /* Check hash vs. user */ 
    async validateInterest(_hash) {
    }

    /* Create a pincode */
    _getpincode(decimals) {
        if (decimals < 2) {
          decimals = 2;
        }
        var chars = "0123456789";
        var randomstring = '';
        for (var i = 0; i < decimals; i++) {
          var rnum = Math.floor(Math.random() * chars.length);
          randomstring += chars.substring(rnum, rnum + 1);
        }
        return randomstring;
    };

    async postMessage(_message, _to , _from, _secret) {
        // Hash
        let dappSymHere = this.getDappSym();
        const encrypted = await this.encrypt(_from, _to, _message, _secret);

        web3.shh.post({
            symKeyID: dappSymHere,
            ttl: 60,
            sig: _from.keyPair,
            powTarget: 2.01,
            powTime: 2,
            topic: '0x00000001',
            payload: web3.utils.fromAscii(encrypted)
        }).then(hash => {                        
            console.log('Sent:\n'.grey,encrypted.green);
        }).catch(err => {
            console.error('Error posting msg: ',err)
        }); 
    };

    async createIdentity() {
        const keyPair = await web3.shh.newKeyPair();
        const publicKey = await web3.shh.getPublicKey(keyPair);
        const privateKey = await web3.shh.getPrivateKey(keyPair);
        return ({keyPair, publicKey, privateKey});
    };

    async unsubscribe(_id) {
    // whatever
        web3.shh.deleteMessageFilter(_id)
            .then((res) => {
                return res;
        });
    };


}

module.exports = Gossip