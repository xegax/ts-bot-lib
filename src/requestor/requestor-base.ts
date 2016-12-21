import {Requestor} from './requestor';
import * as Promise from 'bluebird';
import {assign} from 'lodash';

export class RequestorBase implements Requestor {
  private requestor: Requestor;
  private params?: Object;
  private urlBase: string;

  constructor(requestor: Requestor, urlBase: string, params?: Object) {
    this.requestor = requestor;
    this.params = params;
    this.urlBase = urlBase;
  }

  getParams(params?: Object) {
    return assign({}, this.params, params);
  }

  getUrl(url: string) {
    return this.urlBase + '/' + url;
  }

  sendData(url: string, params?: Object, postData?: any): Promise<any> {
    params = this.getParams(params);
    url = this.getUrl(url);

    return this.requestor.sendData(url, params, postData);
  }

  getData(url: string, params?: Object): Promise<any> {
    params = this.getParams(params);
    url = this.getUrl(url);

    return this.requestor.getData(url, params);
  }

  getJSON(url: string, params?: Object): Promise<any> {
    params = this.getParams(params);
    url = this.getUrl(url);

    return this.requestor.getJSON(url, params);
  }
}