const EventEmitter = require('events');
const Web3 = require('web3');
let web3;
let dappSym;
const nacl = require('tweetnacl');
const naclUtil = require('tweetnacl-util');
nacl.util = naclUtil;

class Gossip extends EventEmitter {
    constructor() {
        super();
        const url = 'ws://178.62.244.110:8546'
        web3 = new Web3(url);
    }

    async init() {
        dappSym = await web3.shh.generateSymKeyFromPassword('swarmcity1');
        let Id = await web3.shh.addSymKey('0x'+dappSym);
        let hasit = await web3.shh.hasSymKey(dappSym);
        console.log('init: ', dappSym, Id, hasit);
        return dappSym;
    };

    async subscribe(_dappSymKeyId) {
        // Subscribe function 
        web3.shh.newMessageFilter({
            symKeyID: _dappSymKeyId,
            topics: ['0x00000001'],
            ttl: 20,
            minPow: 0.8,
        }).then(_Id => {
            //console.log(_id);
            //return ({id: _id});
            setInterval(() => web3.shh.getFilterMessages(_Id).then(msgs => {
                //console.log('listening on ', _dappSymKeyId, ' - ', Date.now());
                if (!msgs.length) return 
                msgs.forEach(m => {
                    //if (hash === hashOfInterest) {
                        const decodePayload = web3.utils.hexToUtf8(m.payload);
                        const [hash, nonceEncoded, cypherText] = decodePayload.split(".");
                        //console.log('hash: ', hash, ' - nonceEncoded: ', nonceEncoded, ' - Cyphertext: ', cypherText);
                        const keyEncoded = 'KzpSTk1pezg5eTJRNmhWJmoxdFo6UDk2WlhaOyQ5N0U=';
                        const key = nacl.util.decodeBase64(keyEncoded);
                        const nonce = nacl.util.decodeBase64(nonceEncoded);
                        const box = nacl.util.decodeBase64(cypherText);

                        // decrypt
                        const messageBytes = nacl.secretbox.open(box, nonce, key);
                        //console.log('hashofinterest: ', nacl.util.encodeUTF8(messageBytes));
                        const msg = nacl.util.encodeUTF8(messageBytes);
                    //}
                        this.emit('message', msg, m.sig);
                })
            }), 1000)
        });
    };

    getDappSym() {
        return dappSym;
    };

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

    async postMessage(_message, _to ,_from) {
        // whatever
        //console.log('posting: ', JSON.stringify(_message));
        // Hash
        let dappSymHere = this.getDappSym();

        //console.log('post: ', _from.privateKey, _to.publicKey, _message, dappSym);
        const hash = web3.utils.sha3(web3.utils.sha3(_from.privateKey) + _to.publicKey);
        // Message String
        const messageString = _message;
        // Encrypt
        //const keyEncoded = btoa(nacl.randomBytes(10)); // this should be what?
        const keyEncoded = 'KzpSTk1pezg5eTJRNmhWJmoxdFo6UDk2WlhaOyQ5N0U='
        const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
        const key = nacl.util.decodeBase64(keyEncoded);
        const messageBytes = nacl.util.decodeUTF8(messageString);
        const box = nacl.secretbox(messageBytes, nonce, key);
        const nonceEncoded = nacl.util.encodeBase64(nonce);
        const cypherText = nacl.util.encodeBase64(box);
        // Concat payload
        const payload = `${hash}.${nonceEncoded}.${cypherText}`;

        web3.shh.post({
            symKeyID: dappSymHere,
            ttl: 60,
            sig: _from.keyPair,
            powTarget: 2.01,
            powTime: 2,
            topic: '0x00000001',
            payload: web3.utils.fromAscii(payload)
        }).then(hash => {
            //console.log('Successfully posted message ', JSON.stringify(payload), ' --- ', hash, + Date.now())
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