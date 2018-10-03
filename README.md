# variations-on-whisper

# Persistent messages (peer-storage)

![](https://i.imgur.com/aJE3r8v.png)

## 1. Use case

------------------------> t
A .[===]..................
B ................[===]...
C ..[===================].

- A broadcasts msg directed to B.
  - B doesn't get it because it expires before logging in.
  - C gets it and stores it. It should not be aware of any info not necessary to resend it.
- B goes online,
  - and sends a signal to the network: "Hi, send my pending messages"
  - C is able to retrieve the message and broadcasts it to the network, which B will pick up

# 2.Implementation

Messages are encrypted on whisper with a symmetric key common to the SwarmCity app.
The payload will be also encrypted:

```javascript
// The hash should refer to a specific conversation and member of the conversation.
// It should not be derivable from the outside

import nacl from "tweetnacl";
import naclUtil from "tweetnacl-util";
nacl.util = naclUtil;
// Hash
const hash = sha3(sha3(chatPrivateKey) + recepientPubKey);
// Encrypt
const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
const key = nacl.util.decodeBase64(keyEncoded);
const messageBytes = nacl.util.decodeUTF8(messageString);
const box = nacl.secretbox(messageBytes, nonce, key);
const nonceEncoded = nacl.util.encodeBase64(nonce);
const cypherText = nacl.util.encodeBase64(box);
// Concat payload
const payload = `${hash}.${nonceEncoded}.${cypherText}`;
broadcast(payload);
//
```

B "I'm online message"
Should send the hash and prove that's this message belong to him

```javascript
const hash = sha3(sha3(chatPrivateKey) + recepientPubKey);
const hashKey = sha3(chatPrivateKey);
const tsHex = Date.now().toString(16);
const signature = await web3.eth.sign(tsHex, account);
const payload = `${hash}.${hashKey}.${tsHex}.${signature}`;
broadcast(payload);
```

Server verification

```javascript
// fire this on an I'm online msg
on("imOnlineMsg", (input) => {
    const [hash, hashKey, tsHex, signature] = input.split('.')
    // authorizeRecepient will only be computed once if it returns true
    let authorizedRecepient;
    function authorizeRecepient(hash, hashKey, tsHex, signature) {
        if (authorizedRecepient) return true
        const recepientPubKey = web3.eth.accounts.recover(tsHex, signature);
        return authorizedRecepient = hash === sha3(hashKey + recepientPubKey);
    }
    let recepientPubKey;
    let _hash;
    for (const msg of msgs) {
        if (msg.hash = hash) {
            if (authorizeRecepient(hash, hashKey, tsHex, signature)) {
                // Authorized recepient
                broadcast(msg.input); // `${hash}.${nonceEncoded}.${cypherText}`
                pruneMsg(msg)
            } else {
                // Un-authorized recepient
                console.log('Unauthorized recepient attempted to access messages of hash: '+hash)
                return
            }
        }
    });
});
```

User reception

```javascript
// compute vars
on("msg", input => {
  const [hash, nonceEncoded, cypherText] = input.split(".");
  if (hash === hashOfInterest) {
    const key = nacl.util.decodeBase64(keyEncoded);
    const nonce = nacl.util.decodeBase64(nonceEncoded);
    const box = nacl.util.decodeBase64(cypherText);

    // decrypt
    const messageBytes = nacl.secretbox.open(box, nonce, key);
    return nacl.util.encodeUTF8(messageBytes);
  }
});
```
