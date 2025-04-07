import { HttpUtil } from '../common/http-util';
import {
  BPM_COGNITO_CLIENT_ID,
  BPM_COGNITO_SECRET,
  BPM_COGNITO_URL,
  BPM_URL
} from '../common/constants';
import { AuthBody, BpmDataBody, BpmDataItem } from '../common/types';
import path from 'path';
import fs from 'fs';

export default class BpmDataRetriever {
  public async getData(): Promise<Array<BpmDataItem>> {
    const items = new Array<BpmDataItem>();
    const openItems = await this.getBpmData(false);
    items.push(...openItems);
    const closedItems = await this.getBpmData(true);
    items.push(...closedItems);

    return items;
  }
  private async getBpmData(closed: boolean): Promise<Array<BpmDataItem>> {
    const items = new Array<BpmDataItem>();
    try {
      const authToken = await this.getAuthToken();

      let lastEvaluatedKey = null;

      const queryPath = '../common/gql/bpm-query.gql';
      const absPath = path.resolve(__dirname, queryPath);
      const queryString = fs.readFileSync(absPath, 'utf8');

      const util = new HttpUtil({
        baseURL: BPM_URL,
        method: 'POST'
      });

      do {
        try {
          const { body: bpmDataBody } = (await util.request({
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
              Authorization: authToken
            },
            data: {
              query: queryString,
              variables: {
                closedCases: closed,
                lastEvaluatedKey
              }
            }
          })) as { body: BpmDataBody };

          lastEvaluatedKey = bpmDataBody?.data?.getBPMTracker?.LastEvaluatedKey;
          items.push(...(bpmDataBody?.data?.getBPMTracker?.Items || []));
        } catch (err) {
          console.log('Failed to get bpm data', { err });

          return [];
        }
      } while (lastEvaluatedKey);
    } catch (ex) {
      console.log(ex);
    }
    return items;
  }

  private async getAuthToken() {
    try {
      const util = new HttpUtil({
        baseURL: BPM_COGNITO_URL,
        method: 'POST'
      });
      const { body: authBody } = (await util.request({
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: {
          grant_type: 'client_credentials',
          client_id: BPM_COGNITO_CLIENT_ID,
          client_secret: BPM_COGNITO_SECRET
        }
      })) as { body: AuthBody };

      const token: string = authBody['access_token'];
      const tokenType = authBody['token_type'];
      return `${tokenType} ${token}`;
    } catch (ex) {
      console.log(ex);
    }
  }
}
