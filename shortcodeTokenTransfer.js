// Shortcode Token Transfer 

// Dependencies
// web3
const Web3 = require('web3');
const events = require('events');
const eventEmitter = new events.EventEmitter();

// contractabi

// Flurkel's geth node
// const url = 'http://192.168.0.134:8545'
// const url = 'ws://192.168.0.172:8545'
// dapplion's digital ocean geth node
const url = 'http://my.ropsten.dnp.dappnode.eth:8545'

// Create the ropsten web3
const web3 = new Web3(url);


web3.eth.getBlockNumber()
.then(res => console.log(`block number: ${res}`));
web3.eth.isSyncing()
.then(res => console.log(res ? `syncing: ${res.currentBlock}/${res.highestBlock} (${res.currentBlock-res.highestBlock})` : `synced!`));


module.exports = {
    getweb3: async function () {
        return web3;
    },
    subscribe: async function (_dappSymKeyId) {
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
                    const obj = JSON.parse(web3.utils.hexToUtf8(m.payload))
                    //console.log(obj, m.sig);
                    this.processMessage(obj, m.sig);
                    //return (_Id, obj, m.sig, m);
                })
            }), 1000)
        });
    },
    unsubscribe: async function (_id) {
    // whatever
        web3.shh.deleteMessageFilter(_id)
            .then((res) => {
                return res;
        });
    },
    _getpincode: function(decimals) {
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
    },
    postMessage: async function (_dappSymKeyId, _message, _from) {
        // whatever
        //console.log('posting: ', JSON.stringify(_message));
        web3.shh.post({
            symKeyID: _dappSymKeyId,
            ttl: 60,
            sig: _from.keyPair,
            powTarget: 2.01,
            powTime: 2,
            topic: '0x00000001',
            payload: web3.utils.fromAscii(JSON.stringify(_message), + Date.now())
        }).then(hash => {
            console.log('Successfully posted message ', JSON.stringify(_message), ' --- ', + Date.now())
        }).catch(err => {
            console.error('Error posting msg: ',err)
        }); 
    },

    createIdentity: async function () {
        const keyPair = await web3.shh.newKeyPair();
        const publicKey = await web3.shh.getPublicKey(keyPair);
        const privateKey = await web3.shh.getPrivateKey(keyPair);
        return ({keyPair, publicKey, privateKey});
    },

    createDappKey: async function () {
        // Create a dappKey
        const dappSymKey = await web3.shh.generateSymKeyFromPassword('swarmcity');
        // Add it to the node
        let Id = await web3.shh.addSymKey('0x'+dappSymKey);
        // CHeck if it's there
        let hasit = await web3.shh.hasSymKey('0x'+dappSymKey);
        console.log('key stored on node? ', hasit);
        return (dappSymKey);
    },

    processMessage: async function (msg, publickey) {
        console.log('Received msg: ',msg, ' - from: ',publickey);
        switch (msg.command) {
            case 'shortcode':
                //this.postMessage(publickey, 'message', receiver.publickey);
                //eventEmitter.emit('receivedMessage', msg);

            break;
        }
    }
};
