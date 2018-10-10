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
const cipher = crypt.encrypt(message, chatPrivateKey);
const payload = msg.regular.encode(chatPrivateKey, recepientAddress, cipher);
broadcast(payload);
//
```

B "I'm online message"
Should send the hash and prove that's this message belong to him

```javascript
const payload = encode(chatPrivateKey, yourAddress, privateKey);
broadcast(payload);
```

Server verification

```javascript
// fire this on an I'm online msg
on("imOnlineMsg", payload => {
  // Ignore unauthorized messages
  if (!msg.online.authorize(payload)) {
    // Maybe punishable action could be taken against this user
    return console.log(
      "Unauthorized user attempted to access messages of hash: " + payload
    );
  }
  const { hash } = msg.online.decode(payload);

  // Search the database for matching msgs
  const msgsToSend = msgs.filter(msg => msg.hash === hash);

  // Send messages and prune
  broadcast(msgsToSend);
  pruneMsg(msgsToSend);
});
```

User reception

```javascript
// compute vars
on("msg", payload => {
  const { hash, cipher } = msg.regular.decode(payload);
  if (hash === hashOfInterest) {
    useInTheApplication(crypt.encrypt(cipher, chatPrivateKey));
  } else {
    store({ hash, cipher });
  }
});
```
