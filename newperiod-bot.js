const config = require('./config.js');

const {Api, JsonRpc} = require('eosjs');
const {JsSignatureProvider} = require('eosjs/dist/eosjs-jssig');
const fetch = require('node-fetch');
const {TextEncoder, TextDecoder} = require('util');


const signatureProvider = new JsSignatureProvider([config.private_key]);
const rpc = new JsonRpc(config.endpoint, {fetch});
const api = new Api({rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder()});


const cust_contract = config.contract;
const auth_user = config.auth_user;
const auth_perm = config.auth_perm;

const action = {
    account: cust_contract,
    name: 'newperiod',
    authorization: [{actor: auth_user, permission: auth_perm}],
    data: {'message':'Automated newperiod'}
};

const message = `VIGOR DAC daily new period has started (courtesy of @${config.auth_user} candidate). Thanks to all candidates who are building. VIG is ready to claim at vigor.ai`;

const do_newperiod = async () => {
    try {
        const res = await api.transact({actions:[action]}, {blocksBehind: 3, expireSeconds: 30});

        console.log(res);
        // newperiod succeeded, send message to telegram bot
        if (config.bot_apiurl && config.bot_apikey){      // VIGORgov Telegram group
            setTimeout(()=>{fetch(`${config.bot_apiurl}${config.bot_apikey}/sendMessage?chat_id=-1001266273284&text=${message}`)}, 6000 );
        }
        if (config.bot_apiurl && config.bot2_apikey){     // VIGOR Telegram group
            setTimeout(()=>{fetch(`${config.bot_apiurl}${config.bot2_apikey}/sendMessage?chat_id=-1001216989023&text=${message}`)}, 6000 );
        }
    }
    catch (e){
	    console.log(e.json.error)
        if (typeof e.json.error.details[0].message === 'string' && e.json.error.details[0].message.indexOf('NEWPERIOD_EARLY') === -1){
            console.error(e.json.error);
        }
    }
};


setInterval(do_newperiod, 3600000);

do_newperiod();
