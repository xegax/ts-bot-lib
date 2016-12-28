import {RequestorBase} from './requestor/requestor-base';
import {createRequestor} from './requestor/requestor';
import {TelegramRequestor, startUpdatingLoop} from './telegram/telegram-requestor';
import {BotManager} from './bot-manager';
import {Bot, Message} from './bot';
import {CommandDesc} from './telegram/command-desc';
import {Telegram} from './telegram/telegram';
import {BotsDB} from './database';
import {assign} from 'lodash';
import * as fs from 'fs';

interface BotInfo {
  token: string;
  userAdminId: number;
  userId: number;
  state?: State;
}

let botInfo: BotInfo = JSON.parse(fs.readFileSync('store/anonmegabot.json').toString());
if (!botInfo) {
  console.log('anonmegabot.json can not be read');
  process.exit(1);
}

let requestorBase = new RequestorBase(createRequestor(), `https://api.telegram.org/bot${botInfo.token}`, {timeout: 50});
let telegram = new TelegramRequestor(requestorBase);

interface User {
  name: string;
  fakeName?: boolean;
  limit?: number;
}

interface State {
  tgtChat?: number;
  autoSend?: boolean;
  chatList?: {[chat_id: string]: string};
  user?: User;
}

let usersName = [
  'бурундук',
  'конь',
  'собака',
  'кошка',
  'кот',
  'мышь',
  'бобёр',
  'черепаха'
];

let predName = [
  'большой', 'маленький', 'толстый', 'худой', 'тяжёлый', 'дикий', 'лёгкий', 'злой', 'добрый', 'больной', 'здоровый', 'домашний'
];

class MyBot extends Bot<State> {
  constructor(chatId: number, chatType: string, requestor: TelegramRequestor, state?: State) {
    super(chatId, chatType, requestor, state);

    if (!this.state) {
      this.state = assign({
        chatList: {},
        autoSend: true,
        user: this.makeUser()
      }, botInfo.state);

      if (chatType != 'private') {
        this.sendText(`Hi there! Send me to private: /chat ${chatId}`);
      }
    }

    if (this.chatType == 'private')
      this.initPrivateChatCommands();
    else
      this.initGroupChatCommands();
  }

  forwardText(text: string, user: User) {
    if (text.trim().length == 0)
      return;

    if (user.fakeName)
      text = ['"' + user.name + '"', 'said:', '\n\t', text].join(' ');
    this.sendText(text);
  }

  forwardPhoto(file_id: string, user: User) {
    this.sendPhoto(file_id, this.chatId, user.fakeName ? 'from "' + user.name + '"': undefined);
  }

  forwardSticker(file_id: string, user: User) {
    this.sendSticker(file_id, this.chatId);
  }

  getOrAddChatList() {
    if (this.state.chatList == null)
      this.state.chatList = {};
    return this.state.chatList;
  }

  initPrivateChatCommands() {
    this.addCommand('chatlist', (msg: Message) => {
      let chatList = this.getOrAddChatList();
      let chats = Object.keys(chatList).map(value => ({
        text: chatList[value],
        cmd: '/chat ' + value
      }));

      if (chats.length == 0)
        this.sendText('chat list is empty');
      else
        this.sendButtons(chats, 'Select one of your chat');
    });

    this.addCommand('send', (msg: Message) => {
      let groupBot: MyBot = botManager.getBot(this.state.tgtChat) as any;
      if (!groupBot)
        return this.sendText('`Invalid chat id, bot not found`');
      groupBot.forwardText(msg.cmd.getArgs(), this.state.user);
    });

    this.addCommand('autoSend', (msg: Message) => {
      let args = msg.cmd.getArgs();
      if (args.length) {
        this.setState({autoSend: +args != 0});
      }

      this.sendText('autoSend is ' + this.state.autoSend);
    });

    this.addCommand('fakename', (msg: Message) => {
      let args = msg.cmd.getArgs();
      if (args.length) {
        this.state.user.fakeName = +args != 0;
        this.forceUpdate();
      }
      this.sendText('fakename is ' + (this.state.user.fakeName ? 1 : 0));
    });

    this.addCommand('name', (msg: Message) => {
      let args = msg.cmd.getArgs();
      if (args.length > 20)
        args = args.slice(0, 20) + '...';
      if (args.length)
        this.setState({user: {name: args, fakeName: this.state.user.fakeName}});
      this.sendText('name is "' + this.state.user.name + '"');
    });

    this.addCommand('chat', (msg: Message) => {
      let chatList = this.getOrAddChatList();
      let args = msg.cmd.getArgs();
      if (!args.length) {
        return this.sendText('your chat is [' + chatList[this.state.tgtChat] + ']');
      }

      let tgtChat = +args.split(' ')[0];
      if (chatList[tgtChat] == null) {
        this.requestor.getChat({chat_id: tgtChat}).then(result => {
          if (!result.ok)
            return;
          chatList[tgtChat] = result.result.title;
          this.sendText('your chat is [' + chatList[tgtChat] + ']');
          this.forceUpdate();
        });
      } else {
        this.sendText('your chat is [' + chatList[tgtChat] + ']');
      }
      this.setState({tgtChat});
    });

    this.setDefaultHandler((msg: Message) => {
      if (!this.state.autoSend)
        return;

      let groupBot: MyBot = botManager.getBot(this.state.tgtChat) as any;
      if (!groupBot)
        return;

      if (msg.msg.photo && msg.msg.photo.length) {
        let files = msg.msg.photo.sort((a, b) => b.width - a.width);
        groupBot.forwardPhoto(files[0].file_id, this.state.user);
      } else if (msg.msg.sticker) {
        groupBot.forwardSticker(msg.msg.sticker.file_id, this.state.user);
      } else {
        groupBot.forwardText(msg.cmd.getArgs(), this.state.user);
      }
    });
  }

  makeUser(): User {
    return {
        name: [
          predName[Math.round(Math.random() * 100) % predName.length],
          usersName[Math.round(Math.random() * 100) % usersName.length]
        ].join(' '),
        fakeName: false
      };
  }

  initGroupChatCommands() {
    this.addCommand('chatid', (msg: Message) => {
      return this.sendText('your chat id is ' + msg.msg.chat.id);
    });

    this.addCommand('help', (msg: Message) => {
      return this.sendText(`Send me to private: /chat ${this.chatId}`);
    });
  }
}

let db = new BotsDB('store/bots.db');
let botManager = new BotManager(db, botInfo.userId, (chatId, chatType, state) => new MyBot(chatId, chatType, telegram, state));

let counter = 0;
let time = Date.now();
startUpdatingLoop(telegram, {}, {
  onUpdates: (data: Telegram.Result<Telegram.Bot.Update>) => {
    console.log('time: ', (Date.now() - time) / 1000);
    console.log(counter, JSON.stringify(data));
    time = Date.now();

    data.result.forEach(upd => {
      if (upd.callback_query) {
        botManager.handleCallbackQuery(upd.callback_query);
      } else {
        botManager.handleMessage(upd.message);
      }
    })
  },
  onError: (err) => {
    console.log(JSON.stringify(err, null, 2));
  }
});