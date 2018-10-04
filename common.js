const EventEmitter = require('events');
const Web3 = require('web3');
let web3;
let dappSym;

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
                    this.emit('message', m.payload, m.sig);
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

    async postMessage(_dappSymKeyId, _message, _from) {
        // whatever
        //console.log('posting: ', JSON.stringify(_message));
        web3.shh.post({
            symKeyID: _dappSymKeyId,
            ttl: 60,
            sig: _from.keyPair,
            powTarget: 2.01,
            powTime: 2,
            topic: '0x00000001',
            payload: web3.utils.fromAscii(_message, + Date.now())
        }).then(hash => {
            console.log('Successfully posted message ', JSON.stringify(_message), ' --- ', hash, + Date.now())
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

    onMessage(data) {
        this.emit('data', data);
    }
}

module.exports = Gossip