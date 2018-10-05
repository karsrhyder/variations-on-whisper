const Gossip = require('./common.js');
const gossip = new Gossip();


let dappSym;
let sender; 
let receiver;
let thirdparty;

// web3
const Web3 = require('web3');
const url = 'ws://178.62.244.110:8546'
const web3 = new Web3(url);

gossip.on('message', (msg) => {
    console.log('Received data: ', msg);
});

gossip.init().then((res) => { 
    gossip.subscribe(res)
});

async function start() {
    sender = await gossip.createIdentity();
    receiver = await gossip.createIdentity();
    thirdparty = await gossip.createIdentity();
    
    //setInterval(() => {
        post();
    //}, 1000);
};

async function post() {
    let from = sender;
    let to = receiver;
    let payload = 'Hello world';
    return (gossip.postMessage(payload, from, to));
    //return (true);
};

start();