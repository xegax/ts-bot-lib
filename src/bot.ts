import {assign} from 'lodash';
import {CommandDesc} from './telegram/command-desc';
import * as Promise from 'bluebird';
import {TelegramRequestor, BotSendMessageArgs} from './telegram/telegram-requestor';
import {Telegram} from './telegram/telegram';
import {Publisher} from './core/publisher';
import {isEqual} from 'lodash';

export interface Message {
  cmd: CommandDesc;
  bot: Bot<any>;
  msg: Telegram.Bot.Message;
}

type CmdHandler = (msg: Message) => Promise<any> | void;

interface CmdHolder {
  handler: CmdHandler;
}

export class Bot<T> extends Publisher {
  static readonly Event = {
    State: 1,
    Enter: 2,
    Leave: 4
  };

  protected state: T;

  private cmdMap: {[cmd: string]: CmdHolder} = {};
  private eventMap: {[event: string]: () => void} = {};
  private defaultHandler: CmdHandler = () => { return null; };
  protected requestor: TelegramRequestor;
  protected chatId: number;
  protected chatType: string;

  constructor(chatId: number, chatType: string, requestor: TelegramRequestor, state?: T) {
    super();
    this.chatId = chatId;
    this.requestor = requestor;
    this.state = state;
    this.chatType = chatType;
  }

  addCommand(name: string, handler: CmdHandler) {
    if (this.cmdMap[name])
      throw 'Command (' + name + ') already registered';
    
    this.cmdMap[name] = {
      handler
    };
  }

  setDefaultHandler(handler: CmdHandler) {
    this.defaultHandler = handler;
  }

  handleMessage(msg: Message): Promise<any> | void {
    let holder = this.cmdMap[msg.cmd.getCmdName()];
    if (holder)
      return holder.handler(msg);
    
    if (this.defaultHandler)
      return this.defaultHandler(msg);
  }

  clone<T>(chatId: number, chatType: string): Bot<T> {
    let bot = new Bot<T>(chatId, chatType, this.requestor, assign({}, this.state) as any);
    Object.keys(this.cmdMap).forEach(key => {
      bot.cmdMap[key] = this.cmdMap[key];
    });

    bot.defaultHandler = this.defaultHandler;

    return bot;
  }

  sendText(text: string, chat_id?: number) {
    if (chat_id == null)
      chat_id = this.chatId;
    this.requestor.sendMessage({chat_id, text});
  }

  sendButtons(list: Array<{text: string, cmd: string}>, text: string, chat_id?: number) {
    if (chat_id == null)
      chat_id = this.chatId;
    let msg: BotSendMessageArgs = {
      chat_id,
      text,
      reply_markup: JSON.stringify({
        inline_keyboard: list.map(button => [{
          text: button.text,
          callback_data: button.cmd
        }]) })
    };
    this.requestor.sendMessage(msg);
  }

  sendPhoto(file_id: string, chat_id?: number, caption?: string) {
    if (chat_id == null)
      chat_id = this.chatId;
    this.requestor.sendPhoto({photo: file_id, chat_id, caption});
  }

  setState(state: T) {
    let newState = assign({}, this.state, state) as T;
    if (isEqual(this.state, newState))
      return;
    this.state = newState;
    this.updateVersion(Bot.Event.State, 1);
  }

  getState(): T {
    return this.state;
  }

  forceUpdate() {
    this.updateVersion(Bot.Event.State, 1);
  }

  getChatId() {
    return this.chatId;
  }
}