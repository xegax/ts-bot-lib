import {Database} from 'sqlite3';
import * as fs from 'fs';
import * as Promise from 'bluebird';

export interface BotEntry {
  id?: number;
  chat_id?: number;
  chat_title?: string;
  chat_type?: string;
  create_time?: number;
  update_time?: number;
  state?: string;
}

export class BotsDB {
  private db: Database;

  constructor(file: string) {
    this.db = new Database(file);
    this.db.serialize(() => this.createTable());
  }

  private createTable() {
    this.db.run('\
      CREATE TABLE IF NOT EXISTS bots(\
        id INTEGER PRIMARY KEY ASC AUTOINCREMENT UNIQUE,\
        chat_id INTEGER UNIQUE,\
        chat_title TEXT,\
        chat_type TEXT,\
        create_time INTEGER,\
        update_time INTEGER,\
        state TEXT\
      )');
  }

  putBot(chat_id: number, chatTitle: string, chatType: string, state: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run('INSERT INTO bots (chat_id, chat_title, chat_type, create_time, update_time, state) VALUES(?, ?, ?, ?, ?, ?)',
          chat_id, chatTitle, chatType, Date.now(), Date.now(), state, (err, data) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
        });
      });
    });
  }

  getBot(chat_id: number): Promise<BotEntry> {
    return new Promise<BotEntry>((resolve, reject) => {
      this.db.serialize(() => {
        this.db.get('SELECT * from bots WHERE chat_id=?', [chat_id], (err, data) => {
          if (!err) {
            resolve(data);
          } else {
            reject(err);
          }
        });
      });
    });
  }

  setBot(bot: BotEntry): Promise<BotEntry> {
    if (bot.chat_id == null)
      throw 'chat_id field required';

    bot.update_time = Date.now();
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        let cols = Object.keys(bot).filter(c => ['id', 'create_time', 'chat_id'].indexOf(c) == -1);
        let vals = cols.map(key => bot[key]);
        this.db.run('UPDATE bots SET ' + cols.map(key => key + ' = ?').join(',') + ' WHERE chat_id = ' + bot.chat_id, vals, (err) => {
          if (err)
            reject(err);
        });

        this.db.get('SELECT * from bots WHERE chat_id=?', bot.chat_id, (err, data) => {
          if (!err)
            resolve(data);
          else
            reject(err);
        });
      });
    });
  }

  getBots(): Promise<Array<BotEntry>> {
    return new Promise<Array<BotEntry>>((resolve, reject) => {
      this.db.serialize(() => {
        this.db.all('SELECT * from bots', (err, data) => {
          if (!err) {
            resolve(data);
          } else {
            reject(err);
          }
        });
      });
    });
  }

  removeBot(chat_id: number) {
    this.db.get('DELETE FROM bots WHERE chat_id=?', chat_id);
  }

  close() {
    this.db.close();
  }
}

/*let db = new BotsDB('bots.db');
db.putBot(1000, JSON.stringify({autoSend: true, count: 11, tgtChat: 998})).catch(e => console.log(e));
db.putBot(1000, JSON.stringify({autoSend: false, count: 55, tgtChat: 1})).catch(e => console.log(e));
db.putBot(500, JSON.stringify({autoSend: false, count: 6})).catch(e => console.log(e));
db.getBot(1000).then((data => {
  console.log(data);
}));

db.setBot({chat_id: 500, state: JSON.stringify({a: 1, b: 2, c: 3})}).then(v => console.log(v));
db.getBots().then(d => console.log(d));*/