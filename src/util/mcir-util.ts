import fs from 'fs';
import path from 'path';
import { HttpUtil } from '../common/http-util';
import { AuthBody, BpmDataBody, BpmDataItem, PrimaryServiceItem } from '../common/types';
import {
  BPM_COGNITO_CLIENT_ID,
  BPM_COGNITO_SECRET,
  BPM_COGNITO_URL,
  BPM_URL
} from '../common/constants';

async function getAuthToken() {
  const util = new HttpUtil({
    baseURL: BPM_COGNITO_URL,
    method: 'POST'
  });

  try {
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
    console.log(token);
    return `${tokenType} ${token}`;
  } catch (ex) {
    console.log(ex);
  }
}

async function main() {
  try {
    const authToken = await getAuthToken();
    const items = new Array<BpmDataItem>();
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
              closedCases: false,
              lastEvaluatedKey
            }
          }
        })) as { body: BpmDataBody };

        console.log('------------------------------------');
        console.log(bpmDataBody);
        lastEvaluatedKey = bpmDataBody?.data?.getBPMTracker?.LastEvaluatedKey;
        items.push(...(bpmDataBody?.data?.getBPMTracker?.Items || []));
      } catch (err) {
        console.log('Failed to get bpm data', { err });

        return [];
      }
    } while (lastEvaluatedKey);

    const csvFilePath = path.resolve(__dirname, 'mcir-output.csv');
    const csvHeaders =
      'bpmDate,id,primaryService,categories,incidentType,detection_source,fyQtr,status\n';
    fs.writeFileSync(csvFilePath, csvHeaders);

    const serviceIdToMcirMap = new Map<string, Array<BpmDataItem>>();
    items.forEach((value) => {
      let parsedPrimaryService: Array<PrimaryServiceItem>;
      const primaryService: string = value.primaryService;
      try {
        parsedPrimaryService = JSON.parse(primaryService) as Array<PrimaryServiceItem>;
      } catch (ex) {
        console.error(`Failed to parse primaryService JSON array: ${primaryService}`, ex);
        return;
      }

      parsedPrimaryService.forEach(({ text, service_id }) => {
        if (service_id) {
          if (!serviceIdToMcirMap.has(service_id)) {
            console.log(service_id);
            serviceIdToMcirMap.set(service_id, []);
          }
          serviceIdToMcirMap.get(service_id)?.push(value);
        } else {
          const txt: string = text.trim();
          if (!serviceIdToMcirMap.has(txt)) {
            serviceIdToMcirMap.set(txt, []);
          }
          serviceIdToMcirMap.get(txt)?.push(value);
        }
      });
    });

    const csvSvcFilePath = path.resolve(__dirname, 'mcir-svc-output.csv');
    const csvSvcHeaders = 'Service_ID,MCIR_Count\n';
    fs.writeFileSync(csvSvcFilePath, csvSvcHeaders);
    serviceIdToMcirMap.forEach((value, key) => {
      // const keyStr = `"${key}"`;
      const csvRow = `${key},${value.length}\n`;
      fs.appendFileSync(csvSvcFilePath, csvRow);
    });

    // const csvFilePath = path.resolve(__dirname, 'mcir-output.csv');
    // const csvHeaders =
    //     'bpmDate,id,primaryService,categories,incidentType,detection_source,fyQtr,status\n';
    // fs.writeFileSync(csvFilePath, csvHeaders);

    // items.forEach((value) => {
    //   const primaryService: string = value.primaryService ? `"${value.primaryService}"` : '';
    //   const categories: string = value.categories ? `"${value.categories}"` : '';
    //   const csvRow = `${value.bpmDate},${value.id},${primaryService},${categories},${value.incidentType},${value.detection_source},${value.fyQtr},${value.status}\n`;
    //   fs.appendFileSync(csvFilePath, csvRow);
    // });

    console.log(`CSV file created at ${csvFilePath}`);
  } catch (ex) {
    console.log(ex);
  }
}

main().catch((err) => {
  console.error('The GraphQL query encountered an error:', err);
});

module.exports = { main };
