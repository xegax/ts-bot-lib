import {Telegram} from './telegram';
import {assign} from 'lodash';
import {Requestor} from '../requestor/requestor';
import * as Promise from 'bluebird';

export interface BotUpdateArgs {
  offset?: number;
  limit?: number;
  timeout?: number; // in sec
}

export interface BotSendMessageArgs {
  chat_id: number | string; // @user or @chat for string
  text: string;
  parse_mode?: "Markdown" | "HTML";
  disable_web_page_preview?: boolean;
  disable_notification?: boolean;
  reply_markup?: string; //json serialized Telegram.Bot.InlineKeyboardMarkup;
}

export interface BotSendPhotoArgs {
  chat_id: number | string;
  photo: string;
  caption?: string;
}

export interface BotSendStickerArgs {
  chat_id: number | string;
  sticker: string;
}

export interface BotEditMessageArgs {
  chat_id?: number | string;
  message_id?: number;
  inline_message_id?: string;
  text: string;
  parse_mode?: "Markdown" | "HTML";
  disable_web_page_preview?: boolean;
  reply_markup?: string; // json serialized Telegram.Bot.InlineKeyboardMarkup;
}

export interface BotGetChatMemberArgs {
  chat_id: number | string;
  user_id: number;
}

export interface BotGetChatArgs {
  chat_id: number | string;
}

export class TelegramRequestor {
  private requestor: Requestor;

  constructor(requestor: Requestor) {
    this.requestor = requestor;
  }

  getUpdates(args: BotUpdateArgs): Promise<Telegram.Result<Telegram.Bot.Update>> {
    return this.requestor.getJSON('getUpdates', args);
  }

  getMe(): Promise<Telegram.Result2<Telegram.Bot.User>> {
    return this.requestor.getJSON('getMe');
  }

  sendMessage(args: BotSendMessageArgs): Promise<Telegram.Result2<Telegram.Bot.Message>> {
    return this.requestor.sendData('sendMessage', {}, args);
  }

  sendPhoto(args: BotSendPhotoArgs, post?: {[key: string]: any}): Promise<Telegram.Result2<Telegram.Bot.Message>> {
    return this.requestor.sendData('sendPhoto', args, post);
  }

  sendSticker(args: BotSendStickerArgs): Promise<Telegram.Result2<Telegram.Bot.Message>> {
    return this.requestor.getJSON('sendSticker', args);
  }

  editMessageText(args: BotEditMessageArgs) {
    return this.requestor.sendData('editMessageText', {}, args);
  }

  getChat(args: BotGetChatArgs): Promise<Telegram.Result2<Telegram.Bot.GroupChat>> {
    return this.requestor.getJSON('getChat', args);
  }

  getChatMember(args: BotGetChatMemberArgs): Promise<Telegram.Result2<Telegram.Bot.ChatMember>> {
    return this.requestor.getJSON('getChatMember', args);
  }

  getChatMembersCount(args: BotGetChatArgs): Promise<Telegram.Result2<number>> {
    return this.requestor.getJSON('getChatMembersCount', args);
  }
}

interface EventHandler {
  getUpdates?(): boolean;   // called before sending request
  onUpdates(data: any);
  onError(data: any);
}

export function startUpdatingLoop(requestor: TelegramRequestor, args: BotUpdateArgs, handler: EventHandler) {
  let newArgs: BotUpdateArgs = assign({}, args);

  let promise: Promise<any> = null;
  let getUpdates = () => {
    let deferredUpdate = 0;
    try {
      if (handler.getUpdates && handler.getUpdates() == false) {
        return console.log('Update handling loop stopped by getUpdates() == false');
      }
    } catch(e) {
      console.log('error', e);
    }

    promise = requestor.getUpdates(newArgs).then(data => {
      promise = null;

      if (data && Array.isArray(data.result) && data.result.length) {
        newArgs.offset = data.result[data.result.length - 1].update_id + 1;
      }

      handler.onUpdates(data);
    }).catch(err => {
      promise = null;

      handler.onError(err);
      deferredUpdate = 10000;
    }).finally(() => {
      if (deferredUpdate == 0) {
        getUpdates();
      } else {
        setTimeout(getUpdates, deferredUpdate);
      }
    });
  }

  getUpdates();

  return {
    stop: () => {
      promise && promise.cancel();
      getUpdates = () => null;
    }
  }
}