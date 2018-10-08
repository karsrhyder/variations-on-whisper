const Gossip = require('./common.js');
const gossip = new Gossip();

let dappSym;
let sender; 
let receiver;
let thirdparty;
let secret; 
// web3
const Web3 = require('web3');
const url = 'ws://178.62.244.110:8546'
const web3 = new Web3(url);

gossip.on('message', (msg) => {
    //console.log('Received data: ', msg);
});

gossip.init(web3).then((res) => { 
    gossip.subscribe(res, secret)
});

async function start() {
    secret = 'MzQ0OTY1MjMxNTUzMTg1MDYyNDY1ODM5OTg1NDczMTc=';
    sender = await gossip.createIdentity();
    receiver = await gossip.createIdentity();
    thirdparty = await gossip.createIdentity();
    
    setInterval(() => {
        post(Date.now());
    }, 10000);
};

async function post(t) {
    let from = sender;
    let to = receiver;
    let payload = 'Hello world at ' + t;
    return (gossip.postMessage(payload, from, to, secret));
};

start();