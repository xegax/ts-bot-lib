import {RequestorBase} from './requestor/requestor-base';
import {createRequestor} from './requestor/requestor';
import {TelegramRequestor, startUpdatingLoop} from './telegram/telegram-requestor';

let token = '107757242:AAHbYHmtLA_zDFWgEGr8RFdaPIb0eGeBTio';
let requestorBase = new RequestorBase(createRequestor(), `https://api.telegram.org/bot${token}`, {timeout: 10});
let telegram = new TelegramRequestor(requestorBase);

let counter = 0;
let time = 0;
startUpdatingLoop(telegram, {}, {
  onUpdates: data => {
    console.log('time: ', (Date.now() - time) / 1000);
    console.log(counter, JSON.stringify(data, null, 2));
    time = Date.now();
  },
  onError: (err) => {
    console.log(JSON.stringify(err, null, 2));
  }
});