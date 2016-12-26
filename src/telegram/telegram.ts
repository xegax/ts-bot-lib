export module Telegram {
  export interface Result<T> {
    ok: boolean;
    result: T[];
    error_code?: number;
    description?: string;
  }
    
  export interface Result2<T> {
    ok: boolean;
    result: T;
    error_code?: number;
    description?: string;
  }

  export module Bot {
    export interface InlineKeyboardButton {
      text: string;
      url?: string;
      callback_data?: string;
      switch_inline_query?: string;
    }

    export interface InlineKeyboardMarkup {
      inline_keyboard: Array<Array<InlineKeyboardButton>>;
    }

    export interface ChatMember {
      user: User;
      status: 'creator' | 'administrator' | 'member' | 'left' | 'kicked';
    }

    export interface User {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
    }
        
    export interface GroupChat {
      id: number;
      type: 'private' | 'group' | 'supergroup' | 'channel';
      title?: string;
      username?: string;
      first_name?: string;
      last_name?: string;
    }

    export interface CallbackQuery {
      id: string;
      from: User;
      message?: Message;
      inline_message_id?: string;
      data: string;
    }

    export interface Update {
      update_id: number;
      message: Message;
      callback_query: CallbackQuery;
    }
        
    export interface Message {
      message_id: number;
      from: User;
      date: number;
      chat: GroupChat;
      forward_from?: User;
      text?: string;
      photo?: PhotoSize[];
      sticker?: Sticker;
      new_chat_participant?: User;
      left_chat_participant?: User;
      new_chat_member?: User;
      left_chat_member?: User;
      group_chat_created?: boolean;
    }
  
    export interface SendMessage {
      chat_id: number;
      text: string;
      parse_mode?: string;
      disable_web_page_preview?: number;
      reply_to_message_id?: number;
      reply_markup?: any;
    }
    
    export interface ReplyKeyboardMarkup {
      keyboard: string[];
      resize_keyboard?: boolean;
      one_time_keyboard?: boolean;
      selective?: boolean;
    }
    
    export interface SendPhoto {
      chat_id: number;
      photo: any;
      caption?: string;
      reply_to_message_id?: number;
      reply_markup?: number;
    }
    
    export interface PhotoSize {
      file_id: string;
      file_size: number;
      width: number;
      height: number;
    }

    export interface Sticker {
      file_id:	string;
      width?: number;
      height?: number;
      thumb?:	PhotoSize;
      emoji?: string;
      file_size?: number;
    }
  }
}