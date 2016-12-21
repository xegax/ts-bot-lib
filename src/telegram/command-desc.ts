var CHAR_CODE_0 = '0'.charCodeAt(0);
var CHAR_CODE_9 = '9'.charCodeAt(0);
var CHAR_CODE_a = 'a'.charCodeAt(0);
var CHAR_CODE_z = 'z'.charCodeAt(0);
var CHAR_CODE_A = 'A'.charCodeAt(0);
var CHAR_CODE_Z = 'Z'.charCodeAt(0);

class Parser {
  private srcText: string;
  private pos: number = 0;
  private parseFrom: number = 0;
    
  constructor(srcText: string) {
    this.srcText = srcText;
  }
    
  expect(str: string): boolean {
    var src = this.srcText;
    var from = this.pos;

    for (; from < src.length; from++) {
      var chr = src[from];
      if (!Parser.isWhiteSpace(chr))
        break;
    }
        
    this.pos = from;
    if (src.substr(from, str.length) === str) {
      this.parseFrom = from + str.length;
      return true;
    }
    return false;
  }
    
  parseName(): string {
    var src = this.srcText;
    var from = this.parseFrom;
        
    for (var n = from; n < src.length; n++) {
      var chr = src[n];
      if(Parser.isNameChar(chr) || Parser.isNumeric(chr))
        continue;
      break;
    }
        
    this.pos = this.parseFrom = n;
    return src.substr(from, n - from);
  }
    
  getRest(): string {
    return this.srcText.substr(this.parseFrom);
  }
    
  static isWhiteSpace(c: string): boolean {
    return c === ' ' || c === '\t';
  }

  static isNumeric(c: string): boolean {
    var code = c.charCodeAt(0);
    return code >= CHAR_CODE_0 && code <= CHAR_CODE_9;
  }
    
  static isNameChar(c: string): boolean {
    var code = c.charCodeAt(0);
    return code >= CHAR_CODE_a && code <= CHAR_CODE_z || code >= CHAR_CODE_A && code <= CHAR_CODE_Z;
  }
}

export class CommandDesc {
  private cmdName: string;
  private botName: string;
  private args: string;
  private messageId: number = 0;
    
  constructor(cmdName, botName, args) {
    this.cmdName = cmdName;
    this.botName = botName;
    this.args = args;
  }
    
  getCmdName() {
    return this.cmdName;
  }
    
  getBotName() {
    return this.botName;
  }
    
  getArgs() {
    return this.args;
  }

  setMessageId(id: number) {
    this.messageId = id;
  }

  getMessageId() {
    return this.messageId;
  }

  static parse(rawText: string): CommandDesc {
    var cmdName = '', botName = null, args = '';
    var p = new Parser(rawText);
    if (p.expect('/')) {
      cmdName = p.parseName();
      if (p.expect('@'))
        botName = p.parseName();
      args = p.getRest().trim();
    } else if (p.expect('@')) {
      botName = p.parseName();
      if (p.expect('/'))
        cmdName = p.parseName();
      else
        throw 'expected "/cmd"';
      args = p.getRest().trim();
    } else
      throw 'expected "/cmd@bot" or "/cmd" or "@bot /cmd"';

    return new CommandDesc(cmdName, botName, args);
  }
    
  static parseSilent(rawText: string): CommandDesc {
    try {
      return CommandDesc.parse(rawText);
    } catch(e) {
      return null;
    }
  }
    
  static parseListSilent(rawText: string): CommandDesc[] {
    var lst = [];
    var lines = rawText.split('\n');
    for (var l = 0; l < lines.length; l++) {
      var cmd = CommandDesc.parseSilent(lines[l]);
      if (cmd)
        lst.push(cmd);
      else
        lst.push(new CommandDesc(null, null, lines[l]));
    }
    return lst;
  }
}