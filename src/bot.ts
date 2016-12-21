type CmdHandler = (args: string) => void;

interface CmdHolder {
  handler: CmdHandler;
}

export class Bot {
  private cmdMap: {[cmd: string]: CmdHolder} = {};
  private defaultHandler: CmdHandler = () => {};

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
}