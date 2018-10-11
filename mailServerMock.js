const msg = require('./lib/msg') 
const sign = require('./lib/sign')
const crypt = require('./lib/crypt')
const EventEmitter = require('events');
const colors = require('colors/safe');

const colorsArray = ['magenta', 'yellow', 'cyan', 'green', 'red', 'blue']
let counter = 0


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

const regularMsgTopic = '0x000001'
const imOnlineMsgTopic = '0x000002'
const topics = [regularMsgTopic, imOnlineMsgTopic]

class MyEmitter extends EventEmitter {}
const myEmitter = new MyEmitter();

// Logger:
topics.forEach(topic => {
    const startTime = Date.now()
    myEmitter.on(topic, payload => {
        const t = String(Date.now() - startTime).padStart(6)
        const msgHash = msg.regular.hash(payload)
        console.log(colors.gray(`LOG: ${t} ms ${topic}, payload hash: ${msgHash}`))
    });
})

// Setup listeners
// ===============

const timeToOnlineB = 1000

const userA = new User('A', sign.generateKey())
const userB = new User('B', sign.generateKey())
const mailServerC = new MailServer('C')


// Setup Emitters
// ==============

// A: Emitter
userB.ignore(true)

const chatPrivateKey = crypt.generateKey()
userA.join(chatPrivateKey)
userB.join(chatPrivateKey)

userA.message(userB.address, userA.chats()[0], 'Super cool message from A to B')
userA.message(userB.address, userA.chats()[0], 'Another super cool message from A to B')

// B: Receiver

setTimeout(() => {
    userB.ignore(false)
    userB.online()
    setTimeout(() => {
        userB.online()
        userA.message(userB.address, userA.chats()[0], 'Last message from A to B')
    }, 500)
}, timeToOnlineB)



// Define user classes
// ===================

function User(name, privateKey) {
    const address = sign.getAddress(privateKey)
    const chats = []
    let ignore = false

    const color = colorsArray[counter++]
    const log = (txt) => console.log(colors[color](`--${name}: ${txt}`))

    return {
        ignore: (_ignore) => {
            ignore = _ignore
        },
        online: () => {
            log(`i'm online`)
            const payload = msg.online.encode(chatPrivateKey, address, privateKey);
            myEmitter.emit(imOnlineMsgTopic, payload);
        },
        join: (chatPrivateKey) => {
            chats.push(chatPrivateKey)
            myEmitter.on(regularMsgTopic, payload => {
                if (ignore) return
                // Ignore unauthorized messages
                const hashOfInterest = msg.regular.getHash(chatPrivateKey, address)
                const { hash, cipher } = msg.regular.decode(payload);
                if (hash === hashOfInterest) {
                    const message = crypt.decrypt(cipher, chatPrivateKey)
                    log(`received a msg of interest: ${message}`)
                }
            });
        },
        message: (addressRecepient, chatPrivateKey, message) => {
            log(`sent message: ${message}`)
            const cipher = crypt.encrypt(message, chatPrivateKey);
            const payload = msg.regular.encode(chatPrivateKey, addressRecepient, cipher);
            myEmitter.emit(regularMsgTopic, payload);
        },
        chats: () => chats,
        address
    }
}

function MailServer(name) {
    // C: Mailserver
    const msgs = []
    const rebroadcastedMsgs = {}

    const color = colorsArray[counter++]
    const log = (txt) => console.log(colors[color](`--${name}: ${txt}`))

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
        if (msgs[hash]) {
            log(`re-broadcasting message after imOnlineMsg`)
            msgs[hash].forEach(msg => myEmitter.emit(regularMsgTopic, msg))
            delete msgs[hash]
        }
    })
    .on(regularMsgTopic, payload => {
        // Prevent listening to the msgs you have broadcasted
        const msgHash = msg.regular.hash(payload)
        if (rebroadcastedMsgs[msgHash]) return
        else rebroadcastedMsgs[msgHash] = true

        const { hash } = msg.regular.decode(payload);
        log(`stored msg`)
        if (!msgs[hash]) msgs[hash] = []
        msgs[hash].push(payload)
    });
}













