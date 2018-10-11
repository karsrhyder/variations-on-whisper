//I'm trying to create a simple public chatroom over whisper that our app can use to do comms over

const Web3 = require('web3');
const crypto = require('eth-crypto'); 

const url = 'ws://192.168.0.134:8546'

console.log('testing with '+url)

const web3 = new Web3(url);
// window.web3 = web3

web3.eth.getBlockNumber()
.then(res => console.log(`block number: ${res}`));
web3.eth.isSyncing()
.then(res => console.log(res ? `syncing: ${res.currentBlock}/${res.highestBlock} (${res.currentBlock-res.highestBlock})` : `synced!`));

web3.shh.net.getId()
.then(res => console.log(`shh net id: ${res}`));

web3.shh.getVersion()
.then(res => console.log(`shh version ${res}`));

let dappSymKeyId;
let senderKey;
let publicKey0;
let publicKey1;

let privateKey1;
let receiverKey;
let thirdKey;

runRoom();

async function runRoom() {
    // Create three identities
    // 0 = SENDER
    senderKey = await web3.shh.newKeyPair();
    console.log('senderKeypiar: ', senderKey);
    publicKey0 = await web3.shh.getPublicKey(senderKey);
    const privateKey0 = await web3.shh.getPrivateKey(senderKey);
    // 1 = RECEIVER
    receiverKey = await web3.shh.newKeyPair();
    publicKey1 = await web3.shh.getPublicKey(receiverKey);
    privateKey1 = await web3.shh.getPrivateKey(receiverKey);
    // 2 = ???
    thirdKey = await web3.shh.newKeyPair();
    const publicKey2 = await web3.shh.getPublicKey(thirdKey);
    const privateKey2 = await web3.shh.getPrivateKey(thirdKey);

    // Create a dappKey
    dappSymKeyId = await web3.shh.generateSymKeyFromPassword('swarmcity');
    console.log('simkeygenerated? ', dappSymKeyId);
    
    // Add it to the node
    const Id = await web3.shh.addSymKey('0x'+dappSymKeyId);

    let hasit = await web3.shh.hasSymKey(dappSymKeyId);
    console.log('key stored on node? ', hasit);

    // The SENDER creates a shortcode, signs it and sends it to the dappChannel.
    const shortcode = 'generate shortcode';
    const sig = 'sign the shortcode';

    // The SENDER sends the shortcode to the RECEIVER
    // This happens over any other medium (tell on the phone, send a text, chatmsg...)

    
    // Now the RECEIVER sets a filter on msgs sent to this topic
    web3.shh.newMessageFilter({
        symKeyID: dappSymKeyId,
        topics: ['0x00000001'],
        ttl: 20,
        minPow: 0.8,
    }).then(id => {
        console.log('return id= ', id);
        setInterval(() => web3.shh.getFilterMessages(id).then(msgs => {
            if (!msgs.length) return 
            msgs.forEach(m => {
                const obj = JSON.parse(web3.utils.hexToUtf8(m.payload))
                    //console.log(m);
                 
                    processMessage(obj, m.sig, m);
            })
        }), 1000)
    });

    // Now the SENDER posts the shortcode
    web3.shh.post({
        symKeyID: dappSymKeyId,
        ttl: 60,
        sig: senderKey,
        powTarget: 2.01,
        powTime: 2,
        topic: '0x00000001',
        payload: web3.utils.fromAscii(JSON.stringify({
            command: 'shortcode',
            shortcode: '1231',
            nonce: '7467325823758234' // WhyLion?
        }), + Date.now())
    }).then(hash => {
        console.log('Successfully posted message', + Date.now())
    }).catch(err => {
        console.error('Error posting msg: ',err)
    }); 
};

// The RECEIVER gets the message and does something with it
async function processMessage(msg, signature, m) {
    console.log('Received msg: ', msg, signature);
    //let test1 = await web3.shh.getPublicKey(signature);
    //console.log('pubkey', test1);
    switch (msg.command) {
        case 'shortcode':
            console.log('respond to the shortcode');
            // derrive pubkey from signature?
            //const sig = 'sign the shortcode';

            web3.shh.post({
                symKeyID: dappSymKeyId,
                ttl: 60,
                sig: receiverKey,
                powTarget: 2.01,
                powTime: 2,
                topic: '0x00000001',
                payload: web3.utils.fromAscii(JSON.stringify({
                    command: 'askPrivate',
                    shortcode: '1231',
                    nonce: '7467325823758234', // WhyLion?
                }), + Date.now())
            }).then(hash => {
                console.log('Successfully posted message', + Date.now())
            }).catch(err => {
                console.error('Error posting msg: ',err)
            });  
            
            break;
        
            case 'askPrivate':
                console.log('askPrivate');
                // Derrive pubkey from sig
                
                // create secret for new room and go there
                // Create a roomKey
                const roomSymKeyId = await web3.shh.generateSymKeyFromPassword('swarmcity-room'+Date.now());
                
                // Add it to the node
                const roomId = await web3.shh.addSymKey('0x'+roomSymKeyId);

                console.log('roomid: ', roomId);

                console.log('signature: ',signature, m.hash);

                const pubReceiver = await crypto.recoverPublicKey(
                    signature,
                    m.hash);
                

                console.log('pubkey receiver: ', pubReceiver);

                // Encrypt it with the RECEIVER's public key
                const encryptedRoomId = await crypto.encryptWithPublicKey(
                    pubReceiver, // by encryping with bobs publicKey, only bob can decrypt the payload with his privateKey
                    JSON.stringify(roomId) // we have to stringify the payload before we can encrypt it
                );
                const encryptedString = crypto.cipher.stringify(encryptedRoomId);

                // Send it back and get there so you can meet the RECEIVER
                web3.shh.post({
                    symKeyID: dappSymKeyId,
                    ttl: 60,
                    sig: senderKey,
                    powTarget: 2.01,
                    powTime: 2,
                    topic: '0x00000001',
                    payload: web3.utils.fromAscii(JSON.stringify({
                        command: 'goPrivate',
                        roomId: encryptedString,
                        nonce: '7467325823758234', // WhyLion?
                    }), + Date.now())
                }).then(hash => {
                    console.log('Successfully posted message', + Date.now())
                }).catch(err => {
                    console.error('Error posting msg: ',err)
                });

                // Now the SENDER sets a filter on msgs sent to this topic
                web3.shh.newMessageFilter({
                    symKeyID: roomId,
                    topics: ['0x00000001'],
                    ttl: 20,
                    minPow: 0.8,
                }).then(id => {
                    console.log('return id= ', id);
                    setInterval(() => web3.shh.getFilterMessages(id).then(msgs => {
                        if (!msgs.length) return 
                        msgs.forEach(m => {
                            const obj = JSON.parse(web3.utils.hexToAscii(m.payload))
                            processMessage(obj, m.sig, m);
                        })
                    }), 1000)
                });
            break;

            case 'goPrivate':
                console.log("We're going private.");
                // Theres a secret roomId for you here!
                console.log('Encrypted room id object: ', msg.roomId);
                const encryptedObject = crypto.cipher.parse(msg.roomId);
                console.log('encrypted room id: ', encryptedObject);
                const decrypted = await crypto.decryptWithPrivateKey(
                    privateKey1,
                    encryptedObject
                );
                console.log('decrypted room id:', decrypted);
 
                // Now the RECEIVER sets a filter on msgs sent to this topic
                // web3.shh.newMessageFilter({
                //     symKeyID: roomId,
                //     topics: ['0x00000001'],
                //     ttl: 20,
                //     minPow: 0.8,
                // }).then(id => {
                //     console.log('return id= ', id);
                //     setInterval(() => web3.shh.getFilterMessages(id).then(msgs => {
                //         if (!msgs.length) return 
                //         msgs.forEach(m => {
                //             const obj = JSON.parse(web3.utils.hexToAscii(m.payload))
                //             processMessage(obj, m.sig, m);
                //         })
                //     }), 1000)
                // });
                break;
        default:
            break;
    }
}; 



