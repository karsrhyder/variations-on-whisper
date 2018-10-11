const msg = require('./lib/msg') 
const sign = require('./lib/sign')
const crypt = require('./lib/crypt')
const EventEmitter = require('events');


// ## 1. Use case

// ------------------------> t
// A .[===]..................
// B ................[===]...
// C ..[===================].

// - A broadcasts msg directed to B.
//   - B doesn't get it because it expires before logging in.
//   - C gets it and stores it. It should not be aware of any info not necessary to resend it.
// - B goes online,
//   - and sends a signal to the network: "Hi, send my pending messages"
//   - C is able to retrieve the message and broadcasts it to the network, which B will pick up


// Whisper mock
// ============
// Setup an eventEmitter that will mock whisper
// To use:
// myEmitter.on('event', (arg1) => {
//     console.log('an event occurred!');
// });
// myEmitter.emit('event', arg);

class MyEmitter extends EventEmitter {}
const myEmitter = new MyEmitter();

const startTime = Date.now()

// Setup listeners
// ===============
const regularMsgTopic = '0x000001'
const imOnlineMsgTopic = '0x000002'
const chatPrivateKey = crypt.generateKey()
const privateKeyB = '0x348ce564d427a3311b6536bbcff9390d69395b06ed6c486954e971d960fe8709'
const addressB = sign.getAddress(privateKeyB)
const timeToOnlineB = 2000

// Logger:
const t = () => String(Date.now() - startTime).padStart(6)
myEmitter.on(regularMsgTopic, payload => {
    console.log(`LOG event: ${t()}ms ${regularMsgTopic}, payload hash: ${msg.regular.hash(payload)}`)
});
myEmitter.on(imOnlineMsgTopic, payload => {
    console.log(`LOG event: ${t()}ms ${imOnlineMsgTopic}, payload hash: ${msg.regular.hash(payload)}`)
});

// C: Mailserver
const msgs = {}
const rebroadcastedMsgs = {}
myEmitter
.on(imOnlineMsgTopic, payload => {
    // Ignore unauthorized messages
    if (!msg.online.authorize(payload)) {
      // Maybe punishable action could be taken against this user
      return console.log(
        "Unauthorized user attempted to access messages of hash: " + payload
      );
    }
    const { hash } = msg.online.decode(payload);
    // Search the database for matching msgs
    for (const _hash of Object.keys(msgs)) {
        if (_hash === hash) {
            console.log('C: re-broadcasting message after imOnlineMsg')
            rebroadcastedMsgs[msg.regular.hash(msgs[_hash])] = true
            myEmitter.emit(regularMsgTopic, msgs[_hash]);
            delete msgs[_hash]
        }
    }
})
.on(regularMsgTopic, payload => {
    // Prevent listening to the msgs you have broadcasted
    if (rebroadcastedMsgs[msg.regular.hash(payload)]) {
        return
    }
    const { hash } = msg.regular.decode(payload);
    console.log('C: stored msg')
    msgs[hash] = payload
});


// Setup Emitters
// ==============

// A: Emitter
emitA()
function emitA() {
    const message = 'Super cool message from A to B'
    const cipher = crypt.encrypt(message, chatPrivateKey);
    const payload = msg.regular.encode(chatPrivateKey, addressB, cipher);
    myEmitter.emit(regularMsgTopic, payload);
}

// B: Receiver
setTimeout(() => {
    myEmitter.on(regularMsgTopic, payload => {
        // Ignore unauthorized messages
        const hashOfInterest = msg.regular.getHash(chatPrivateKey, addressB)
        const { hash, cipher } = msg.regular.decode(payload);
        if (hash === hashOfInterest) {
            const message = crypt.decrypt(cipher, chatPrivateKey)
            console.log('B: received a msg of interest: '+message)
        } else {
            // B is not storing msgs
        }
    });

    const payload = msg.online.encode(chatPrivateKey, addressB, privateKeyB);
    myEmitter.emit(imOnlineMsgTopic, payload);

}, timeToOnlineB)













