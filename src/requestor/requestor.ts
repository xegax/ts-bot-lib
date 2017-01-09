import * as Promise from 'bluebird';
import * as request from 'request';

const DEFAULT_TIMEOUT = 60000;
export interface Requestor {
  sendData(url: string, params?: Object, postData?: any): Promise<any>;
  getData(url: string, params?: Object): Promise<any>;
  getJSON(url: string, params?: Object): Promise<any>;
}

function getUrl(url: string, params: Object): string {
  let l = Object.keys(params || {}).map(key => [key, params[key]].join('='));
  if (l.length > 0) {
    return url + '?' + l.join('&');
  } else {
    return url;
  }
}

class RequestorImpl implements Requestor {
  private logging = false;

  constructor(logging: boolean = false) {
    this.logging = logging;
  }
  
  sendData<T extends {}>(url: string, params?: Object, postData?: any): Promise<T> {
    return new Promise<T>((resolve, reject, cancelSetter) => {
      let opts: request.CoreOptions & {url: string} = {
        url: getUrl(url, params), form: Object.create(null)
      };

      if (!postData)
        postData = {};

      Object.keys(postData).forEach(key => {
        opts.form[key] = postData[key];
      });

      if (this.logging) {
        console.log('sendData', opts.url, JSON.stringify(opts.form, null, 2));
      }

      let req = request.post(opts, (err, resp, data) => {
        if (err) {
          return reject(err);
        } else {
          resolve(data);
        }
      });

      cancelSetter && cancelSetter(() => {
        req.abort();
      });
    });    
  }

  getData<T extends {}>(url: string, params?: Object): Promise<T> {
    return new Promise<T>((resolve, reject, cancelSetter) => {
      url = getUrl(url, params);
      if (this.logging) {
        console.log('getData', url);
      }
      let req = request.get(getUrl(url, params), {timeout: (params['timeout'] * 1000 + 5000) || DEFAULT_TIMEOUT}, (err, resp, data) => {
        if (err) {
          return reject(err);
        } else {
          resolve(data);
        }
      });

      cancelSetter && cancelSetter(() => {
        req.abort();
      });
    });
  }

  getJSON<T extends {}>(url: string, params?: Object): Promise<T> {
    return new Promise<T>((resolve, reject, cancelSetter) => {
      url = getUrl(url, params);
      if (this.logging) {
        console.log('getJSON', url);
      }
      let req = request.get(url, {timeout: (params['timeout'] * 1000 + 5000) || DEFAULT_TIMEOUT}, (err, resp, data) => {
        try {
          if (err) {
            return reject(err);
          } else {
            resolve(JSON.parse(data));
          }
        } catch(e) {
          reject(e);
        }
      });

      cancelSetter && cancelSetter(() => {
        req.abort();
      });
    });
  }
}

export function createRequestor(logging = false): Requestor {
  return new RequestorImpl(logging);
}

let globalRequestor: Requestor = new RequestorImpl();

export function getGlobalRequestor(): Requestor {
  return globalRequestor;
}