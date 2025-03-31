import fs from 'fs';
import path from 'path';
import { HttpUtil } from '../common/http-util';
import {
  ApplicationSecurityIssueCountItem,
  ApplicationStatDataItem,
  AuthBody,
  TrustData,
  TrustDataBody
} from '../common/types';
import {
  AZURE_CLIENT_ID,
  AZURE_CLIENT_SECRET,
  AZURE_SCOPE,
  AZURE_URL,
  OPUS_URL
} from '../common/constants';

async function getAzureToken() {
  const util = new HttpUtil({
    baseURL: AZURE_URL,
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
        client_id: AZURE_CLIENT_ID,
        client_secret: AZURE_CLIENT_SECRET,
        scope: AZURE_SCOPE
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

function getVmCount(vmCountStr: string): number {
  const vmCountArr: string[] = vmCountStr.split(';');
  if (vmCountArr.length !== 5) {
    return 0;
  } else {
    // parse string to number
    const vmCountCritical: number = parseInt(vmCountArr[0], 10) || 0;
    const vmCountHigh: number = parseInt(vmCountArr[1], 10) || 0;
    return vmCountCritical + vmCountHigh;
  }
}

async function main() {
  const authToken = await getAzureToken();
  try {
    const queryPath = '../common/gql/gql-opus-partial-query.gql';
    const absPath = path.resolve(__dirname, queryPath);
    const queryString = fs.readFileSync(absPath, 'utf8');

    const util = new HttpUtil({
      baseURL: OPUS_URL,
      method: 'POST'
    });

    const { body: trustDataBody } = (await util.request({
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: authToken
      },
      data: {
        query: queryString
      }
    })) as { body: TrustDataBody };

    const trustDataItems = new Map<string, TrustData>();

    const appMetadataItems: Array<TrustData> = trustDataBody.data.getApplicationsMetadata;
    appMetadataItems.forEach((item) => {
      trustDataItems.set(item.appId, item);
    });

    const applicationStatDataItem: Array<ApplicationStatDataItem> =
      trustDataBody.data.getApplicationsStats;
    applicationStatDataItem.forEach((item) => {
      const trustData = trustDataItems.get(item.appId);
      if (trustData) {
        trustData.name = `"${trustData.name}"`;
        trustData.mttr = item.mttr != null ? item.mttr : 'N/A';
        trustData.rpo = item.rpo;
        trustData.rto = item.rto;
        trustData.slo = item.slo != null ? item.slo : 'N/A';
        trustData.resiliencyRisk = item.resiliencyRisk != null ? item.resiliencyRisk : 'N/A';
      }
    });

    const appSecurityIssuesCounts: Array<ApplicationSecurityIssueCountItem> =
      trustDataBody.data.getApplicationsSecurityIssuesCounts;
    appSecurityIssuesCounts.forEach((item) => {
      const trustData = trustDataItems.get(item.appId);
      if (trustData) {
        const vmCountStr = item.vmCount;
        trustData.spIssues = getVmCount(vmCountStr);
      }
    });

    const csvFilePath = path.resolve(__dirname, 'output.csv');
    const csvHeaders =
      'appId,code,division,name,status,tier,type,mttr,rpo,rto,slo,resiliencyRisk,spIssues\n';
    fs.writeFileSync(csvFilePath, csvHeaders);

    trustDataItems.forEach((value) => {
      if (value.mttr && value.status === 'Active') {
        const csvRow = `${value.appId},${value.code},${value.division},${value.name},${value.status},${value.tier},${value.type},${value.mttr},${value.rpo},${value.rto},${value.slo},${value.resiliencyRisk},${value.spIssues}\n`;
        fs.appendFileSync(csvFilePath, csvRow);
      }
    });

    console.log(`CSV file created at ${csvFilePath}`);
  } catch (ex) {
    console.log(ex);
  }
}

main().catch((err) => {
  console.error('The GraphQL query encountered an error:', err);
});

module.exports = { main };
