const Gossip = require('./common.js');
const gossip = new Gossip();
const fs = require("fs");
const argv = require('minimist')(process.argv.slice(2));

let my; 
let receiver;
let secret; 

// web3
const Web3 = require('web3');
const url = 'ws://178.62.244.110:8546'
const web3 = new Web3(url);

gossip.on('message', (msg) => {
    //console.log('Received data: ', msg);
    //if (msg == 'Hello world!') {
        //post('Right back at you', Date.now());
        gossip.postMessage('Right back at you - ' + Date.now(), my, receiver, secret);
    //}  
});

fs.readFile('./test_identities/identity-'+argv.sender+'.txt', 'utf8', function(err, res) {
    my = JSON.parse(res);
    //console.log(typeof my, err);
});

fs.readFile('./test_identities/identity-'+argv.receiver+'.txt', 'utf8', function(err, res) {
    receiver = JSON.parse(res);
    //console.log(typeof receiver, err);
});

gossip.init(web3, argv.dappsym, argv.sender, argv.secret).then((res) => { 
    gossip.subscribe(argv.dappsym, argv.secret, my, receiver);
    secret = argv.secret;
    if(argv.init) {
        gossip.postMessage('Hello world!', receiver, my, secret);
    }
    
    //post('Hello world!', Date.now());
});

async function start() {
    //setInterval(() => {
       // post('Hello world!', Date.now());
    //}, 1000);
};

async function post(m, t) {
    // with every post our script takes a random identity to send to
    // which may or may not be online 
    // the receiver echoes the message while this script may or may not be online
    let payload = m;
    if(payload && my && receiver && secret) {
        //console.log(payload, my, receiver, secret);
        return (gossip.postMessage(payload, my, receiver, secret));
    } else  {
        console.log('dont have all ingredietns to post')
    }
    
};

//start();
