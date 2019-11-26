const util = require('util');

const config = require('./config.json');

const {Api, JsonRpc} = require('eosjs');
const {JsSignatureProvider} = require('eosjs/dist/eosjs-jssig');
const fetch = require('node-fetch');
const {TextEncoder, TextDecoder} = require('util');


const signatureProvider = new JsSignatureProvider([config.private_key]);

var currentEndpoint = 0;

// newperiod action
const action = {
  account: config.contract,
  name: config.action,
  authorization: [{actor: config.auth.user, permission: config.auth.perm}],
  data: {message: util.format(config.messages.action, config.auth.user)}
};

const do_newperiod = async () => {
  // Setup current endpoint
  const rpc = new JsonRpc(config.endpoints[currentEndpoint], {fetch});
  const api = new Api({rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder()});

  try {
    const res = await api.transact({actions:[action]}, {blocksBehind: 3, expireSeconds: 30});

    console.log('Action', config.action, 'executed');
    // newperiod succeeded, send messages to telegram if configured
    setTimeout(do_telegram, 6000 );
  }
  catch (e){
    switch (e.json.error.code) {
      case 3081001:     // CPU Limit
        console.log('Endpoint:', config.endpoints[currentEndpoint], 'failed to execute', config.action, 'due to CPU limit, trying next...');
        // Next endpoint
        if (++currentEndpoint < config.endpoints.length) {
          setTimeout(do_newperiod, config.intervals.retry);
        } else {
          // No more endpoints
          currentEndpoint = 0;
          console.error('All endpoints were tried and', config.action, 'failed to execute in all. Retrying in a bit...');
        }
        break;
      case 3050003:     // assertion
        if (e.json.error.details &&
            e.json.error.details[0] &&
            e.json.error.details[0].message &&
            e.json.error.details[0].message.indexOf('NEWPERIOD_EARLY') != -1) {
          console.log('Too early to execute', config.action + '.', 'Retrying in a bit...');
        } else {
          console.error('Unknown assertion:', e.json.error);
        }
        break;
      default:
        console.error('Unknown failure:', e.json.error);
    }
  }
};

const do_telegram = () => {
  if (config.telegram && config.telegram.apiurl && config.telegram.apikey) {
    const message = util.format(config.messages.telegram, config.auth.user);

    Object.keys(config.telegram.chats).map(chat => {
      fetch(`${config.telegram.apiurl}${config.telegram.apikey}/sendMessage?chat_id=${config.telegram.chats[chat]}&text=${message}`)
        .then(res => res.json())
        .then(json => {
          if (json.ok) {
            console.log('Message to chat', chat, 'sent successfuly');
          } else {
            console.log('Error sending message to chat', chat + ':', json);
          }
        })
        .catch (err => {
          console.error('Failed to send message to chat', chat);
          console.error(err)
        });
    });
  }
}

setInterval(do_newperiod, config.intervals.execute);

do_newperiod();
