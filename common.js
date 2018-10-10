const EventEmitter = require('events');
const colors = require('colors');
const level = require('level');
const nacl = require('tweetnacl');
const naclUtil = require('tweetnacl-util');
nacl.util = naclUtil;

let web3;
let dappSym;

let iam;


class Gossip extends EventEmitter {
    constructor() {
        super();
    }

    // Initialize the library
    async init(_web3, _dappSym, _sender, _secret) {
        console.clear();
        console.log("Gossip - Whisper".yellow);
        web3 = _web3;
        dappSym = _dappSym;
        const db = level(_sender+'-localCache');

        //dappSym = await web3.shh.generateSymKeyFromPassword('swarmcity1');
        let Id = await web3.shh.addSymKey('0x'+dappSym);
        let hasit = await web3.shh.hasSymKey(dappSym);
        console.log(colors.blue('Initializing: \n', 'DappSym: ', dappSym, '\n Id: ', Id, '\n Exists on node: ', hasit, '\n Secret: ', _secret));
        
        //console.log(nacl.util.encodeBase64(nacl.randomBytes(32)).red);

        return dappSym;
    };

    async subscribe(_dappSymKeyId, _secret, _from, _to) {
        // Subscribe function 
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
                        const hash = res[0];
                        //console.log('\n\Received:'.gray);
                        //console.log(hash.blue);

                        const hashOfInterest = web3.utils.sha3(web3.utils.sha3(_from.keyPair) + _to.keyPair);
                        //console.log(hash, hashOfInterest);
                        if (hash === hashOfInterest) {
                            //console.log('found hash of interest');
                            //console.log(hashOfInterest);
                            
                            this.decrypt(_secret, res[1], res[2]).then((res) => {
                                console.log(colors.blue('\nI, ', _from.publicKey.substring(0,8),"...",' am interested in this message.'));
                                console.log(res.blue);
                                this.emit('message', res, m.sig);
                            });
                        } else {
                            console.log(colors.gray('\nI, ', _from.publicKey.substring(0,8),"...",' am not interested in this message '  + Date.now()));
                            //console.log(hash);
                            //console.log(hashOfInterest);
                            // store for future rebroadcasting
                            // let key = _from.publicKey+'-msg-' + m.hash;
                            // let val = m;
                            // db.put(key, JSON.stringify(val)).then(() => {
                            //     console.log('Storing %j at %s', val, key);
                            // }).catch((err) => {
                            //     console.log(err);
                            //     //return reject(err);
                            // });
                        }
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
        //console.log('about to ecnr: ', _secret);

        const hash = web3.utils.sha3(web3.utils.sha3(_to.keyPair) + _from.keyPair);
        const messageString = _message;
        const nonce = await nacl.randomBytes(nacl.secretbox.nonceLength);
        const key = await nacl.util.decodeBase64('A1v/xZFFMwUry3r5n6Uo6BPNNhr0YGSlqUxTuNAWrHk=');
        const messageBytes = await nacl.util.decodeUTF8(messageString);
        const box = await nacl.secretbox(messageBytes, nonce, key);
        const nonceEncoded = await nacl.util.encodeBase64(nonce);
        const cypherText = await nacl.util.encodeBase64(box);
        //console.log(`${hash}.${nonceEncoded}.${cypherText}`);
        return (`${hash}.${nonceEncoded}.${cypherText}`);
    };

    /* Decrypt the payload */
    async decrypt(_secret, _nonceEncoded, _cypherText) {
        const key =  nacl.util.decodeBase64('A1v/xZFFMwUry3r5n6Uo6BPNNhr0YGSlqUxTuNAWrHk=');
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

    async postMessage(_message, _from , _to, _secret) {
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
            console.log('\n',_from.publicKey.substring(0,8).grey,' posts:\n'.grey,encrypted.green);
            console.log('To:\n'.grey,_to.publicKey.substring(0,8),"...");
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