import {Telegram} from './telegram/telegram';
import {Bot} from './bot';
import {CommandDesc} from './telegram/command-desc';
import {BotsDB} from './database';

export class BotManager {
  private botsMap: {[key: number]: Bot<any>} = {};
  private botMaker: (chatId: number, chatType: string, state: any) => Bot<any>;
  private db: BotsDB;
  private userId: number;

  constructor(db: BotsDB, userId: number, botMaker: (chatId: number, chatType: string, state: any) => Bot<any>) {
    this.botMaker = botMaker;
    this.db = db;
    this.userId = userId;

    db.getBots().then(bots => {
      bots.forEach(bot => {
        this.loadBot(bot.chat_id, bot.chat_type, JSON.parse(bot.state));
      });
    });
  }

  getBot(chatId: number): Bot<any> {
    return this.botsMap[chatId];
  }

  handleCallbackQuery(callback: Telegram.Bot.CallbackQuery) {
    let msg = callback.message;
    msg.text = callback.data;
    this.handleMessage(msg);
  }

  handleMessage(message: Telegram.Bot.Message) {
    const chatId = +message.chat.id;
    let bot = this.getBot(chatId);
    if (!bot) {
      bot = this.createBot(chatId, message.chat.type, message);
      if (message.new_chat_member && message.new_chat_member.id == this.userId)
        bot.updateVersion(Bot.Event.Enter);
    }

    if (message.left_chat_member && message.left_chat_member.id == this.userId) {
      delete this.botsMap[chatId];
      this.db.removeBot(message.chat.id);
      bot.updateVersion(Bot.Event.Leave);
      return;
    }

    let cmdDesc = CommandDesc.parseListSilent(message.text || '');
    let nextCommand = () => {
      if (cmdDesc.length == 0)
        return;

      let promise;
      try {
        promise = bot.handleMessage({msg: message, cmd: cmdDesc[0], bot});
      } catch(e) {
        console.log('error handling command');
        console.log(cmdDesc[0].getCmdName(), cmdDesc[0].getArgs());
      }
      cmdDesc.splice(0, 1);
      if (promise) {
        promise.finally(nextCommand);
      } else {
        nextCommand();
      }
    };

    nextCommand();
  }

  private onBotChanged = (mask, bot: Bot<any>) => {
    this.db.setBot({
      chat_id: bot.getChatId(),
      state: JSON.stringify(bot.getState())
    });
  }

  private createBot(chatId: number, chatType: string, msg: Telegram.Bot.Message, state?: any): Bot<any> {
    let bot = this.botMaker(chatId, chatType, state);
    bot.addSubscriber(this.onBotChanged);

    this.botsMap[chatId] = bot;
    console.log('bot created, total = ', Object.keys(this.botsMap).length);
    this.db.putBot(chatId, msg.chat.title, msg.chat.type, JSON.stringify(bot.getState()));
    return bot;
  }

  private loadBot(chatId: number, chatType: string, state?: any): Bot<any> {
    let bot = this.botMaker(chatId, chatType, state);
    bot.addSubscriber(this.onBotChanged);
    this.botsMap[chatId] = bot;
    console.log('bot loaded, state', state);
    return bot;
  }
}