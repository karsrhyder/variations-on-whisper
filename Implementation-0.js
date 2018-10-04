const Gossip = require('./common.js');
const gossip = new Gossip();
const btoa = require('btoa');
const nacl = require('tweetnacl');
const naclUtil = require('tweetnacl-util');
nacl.util = naclUtil;

let dappSym;
let sender; 
let receiver;
let thirdparty;

// web3
const Web3 = require('web3');
const url = 'ws://178.62.244.110:8546'
const web3 = new Web3(url);

gossip.on('message', (input) => {
    console.log(`Received data: "${JSON.stringify(input)}"`);

});

gossip.init().then((res) => { 
    gossip.subscribe(res)
});

async function start() {
    sender = await gossip.createIdentity();
    receiver = await gossip.createIdentity();
    thirdparty = await gossip.createIdentity();
    
    setInterval(() => {
        post();
    }, 1000);
};

async function post() {
    let dappSym = await gossip.getDappSym();
    // Hash
    const hash = web3.utils.sha3(web3.utils.sha3(sender.privateKey) + receiver.publicKey);
    // Message String
    const messageString = 'Hello world!';
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
    return (gossip.postMessage(dappSym, payload, receiver));
    //return (true);
};

start();