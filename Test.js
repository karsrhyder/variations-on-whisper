// This test is using whipser, shortcodes to do a token transfer.

const scUtils = require('./shortcodeTokenTransfer');

// web3
const Web3 = require('web3');

// Flurkel's geth node
const url = 'http://192.168.0.172:8545'

// dapplion's digital ocean geth node
// const url = 'http://my.ropsten.dnp.dappnode.eth:8545'

// Create the ropsten web3
const web3 = new Web3(url);

let sender; 
let receiver;
let thirdparty;

let dappSym;

async function runTest() {
    //const dappSym = await scUtils.createDappKey();
    // Create a dappKey and add it to the node
    dappSym = await web3.shh.generateSymKeyFromPassword('swarmcity1');

    let Id = await web3.shh.addSymKey('0x'+dappSym);
    //dappSym = 'ba49fe0abc8684a1cfc100128b7162e7e2384b56feeb1584581b1538ff02acf6';

    sender = await scUtils.createIdentity();
    receiver = await scUtils.createIdentity();
    thirdparty = await scUtils.createIdentity();

    let subscriptionRes = await scUtils.subscribe(dappSym);
    //subscriptionRes.on('received-message', function(msg){ console.log('event? ', msg)});

    setInterval(() => {
        post();
    }, 5000);

    function post() {
        let msg = { command: 'shortcode',
        shortcode: scUtils._getpincode(4),
        nonce: Date.now() };
        return (scUtils.postMessage(dappSym, msg, receiver).then((res)=>{
            //console.log(res)
        }));
    }

}

runTest();



