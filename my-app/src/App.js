import React, { Component } from 'react';
import Web3 from 'web3';
import logo from './logo.svg';
import './App.css';

const url = 'ws://178.62.244.110:8546'

let web3 = new Web3(url);
web3.shh.getInfo((res, err) => {
  console.log(res, err);
});

function parse_query_string(query) {
  var vars = query.split("&");
  var query_string = {};
  for (var i = 0; i < vars.length; i++) {
    var pair = vars[i].split("=");
    var key = decodeURIComponent(pair[0]);
    var value = decodeURIComponent(pair[1]);
    // If first entry with this name
    if (typeof query_string[key] === "undefined") {
      query_string[key] = decodeURIComponent(value);
      // If second entry with this name
    } else if (typeof query_string[key] === "string") {
      var arr = [query_string[key], decodeURIComponent(value)];
      query_string[key] = arr;
      // If third or later entry with this name
    } else {
      query_string[key].push(decodeURIComponent(value));
    }
  }
  return query_string;
}

const topic = "0x526f6f6d";

class App extends Component {

  constructor(props) {
    super(props);
    // create a ref to store the textInput DOM element
    this.textInput = React.createRef();
    this.publicKey = 'unknown';
    //console.log(props.location.query.p);
var query = window.location.search.substring(1);
var qs = parse_query_string(query);
this.peer = qs.p;
    //this.peer = props.location.query.p;
      
    this.state = {
      roomName: 'demoRoom',
      msgs: [],
      input: '',
      to: '',
      from: '',
      hash: null
    };
  }

  componentDidMount() {
    // Create identity
    
    async function getIdentity() {
        // let kID = '';
        // kID = localStorage.getItem('kId');
        // let publicKey = localStorage.getItem('publicKey');
        // const privateKey = localStorage.getItem('privateKey');
        // this.setState({ publicKey, privateKey })
        // console.log(publicKey, privateKey)

        let kID = '';
        kID = await web3.shh.newKeyPair()
        localStorage.setItem('kId', kID);
        let publicKey = await web3.shh.getPublicKey(kID);
        localStorage.setItem('publicKey', publicKey);
        const privateKey = await web3.shh.getPrivateKey(kID)
        localStorage.setItem('privateKey', privateKey);
        this.setState({ publicKey, privateKey })
        console.log(publicKey, privateKey)
        this.publicKey = publicKey;

        this.textInput.current.focus();

        let symkey = await web3.shh.generateSymKeyFromPassword('swarmcity');
        console.log('simkeygenerated? ', symkey);
        let symId = await web3.shh.addSymKey('0x'+symkey);
        console.log('added? symId:', symId);

        let hasit = await web3.shh.hasSymKey('0x'+symkey);
        let getit = await web3.shh.getSymKey(symkey);

        console.log('simkeyfound? ', hasit);
        console.log('getit? ', getit);

        web3.shh.newMessageFilter({
          symKeyID: symId,
          sig: publicKey,
          ttl: 20,
          topics: ['0xffddaa11'],
          minPow: 0.8,
        }).then(id => {
            console.log('return id= ', id)
            setInterval(() => web3.shh.getFilterMessages(id).then(msgs => {
              if (!msgs.length) return 
              console.log('Got msgs', msgs)
           }), 1000)
        });

        setInterval(() => web3.shh.post({
          symKeyID: symkey,
          ttl: 10,
          topic: '0xffddaa11',
          powTarget: 2.01,
          powTime: 2,
          payload: web3.utils.fromAscii('testing: ', + Date.now())
        }).then(hash => {
          console.log('Successfully posted message', + Date.now())
          //this.setState({ hash })
        }).catch(err => {
          console.error('Error posting msg: ',err)
          //this.setState({ hash: err.message })
        }),2000);

        
      // Long poll messages
      // await web3.shh.newMessageFilter({ privateKeyID: kID }).then(id => {
      //   setInterval(() => web3.shh.getFilterMessages(id).then(msgs => {
      //     if (!msgs.length) return 
      //     console.log('Got msgs', msgs)
      //     console.log(this.state)
      //     this.setState({ msgs: [
      //       ...this.state.msgs, 
      //       ...msgs.map(m => web3.utils.hexToAscii(m.payload))
      //     ] })
      //   }), 1000)
      // })  
  
  }
    getIdentity.bind(this)().catch(err => {
      console.error('Error creating identity: ',err)
    })
  }
  

  async createIdentity() {
    let kID = '';
    kID = await web3.shh.newKeyPair()
    localStorage.setItem('kId', kID);
    let publicKey = await web3.shh.getPublicKey(kID);
    localStorage.setItem('publicKey', publicKey);
    const privateKey = await web3.shh.getPrivateKey(kID)
    localStorage.setItem('privateKey', privateKey);
    this.setState({ publicKey, privateKey })
    console.log(publicKey, privateKey)
    this.publicKey = publicKey;
  }

  
  _handleKeyPress(e) {
    if (e.key === 'Enter') {
      console.log(this.textInput.current.value);
      this.sendMsg(this.textInput.current.value);
      this.textInput.current.value = '';
      this.textInput.current.focus();
      console.log(this.state.msgs);
    }
  };

  sendMsg(msg) {
    console.log('Sending: '+msg+' to: '+this.peer);
    
    web3.shh.post({
      symKeyID: 'x',
      ttl: 10,
      topic: '0xffddaa11',
      powTarget: 2.01,
      powTime: 2,
      payload: web3.utils.fromAscii(msg)
    }).then(hash => {
      console.log('Successfully posted message')
      this.setState({ hash })
    }).catch(err => {
      console.error('Error posting msg: ',err)
      this.setState({ hash: err.message })
    })
     
  }

  appendMsg(msg, sender) {
    // add message to the dialogue
    // set custom class when it's not me or when it is me;
    // .msgme .msgother

  };
 
  render() {
    
    return (

      <div className="App">
        <div class="share">http://localhost:3000/?p={this.state.publicKey}</div>
        <div class="dialogue">
        {this.state.msgs.map((m, i) => <div class="msgme" key={i}>{m}</div>)}
        </div>
        <div class="footer">
          <input type="text" ref={this.textInput} id="msginput" onKeyPress={this._handleKeyPress.bind(this)}   />
        </div>
      </div>
    );
  }
}

export default App;
