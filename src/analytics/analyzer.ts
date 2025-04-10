import BpmDataRetriever from './bpm-data-retriever';
import { BpmDataItem, PrimaryServiceItem, ServiceDataItem, TrustData } from '../common/types';
import TrustDataRetriever from './trust-data-retriever';
import path from 'path';
import fs from 'fs';

async function main() {
  const trustRetriever = new TrustDataRetriever();
  const trustData: Array<TrustData> = await trustRetriever.getData();
  const serviceIdToTrustDataMap = new Map<string, TrustData>();
  const serviceNameToTrustDataMap = new Map<string, TrustData>();
  trustData.forEach((element) => {
    serviceIdToTrustDataMap.set(element.code, element);
    serviceNameToTrustDataMap.set(element.name, element);
  });

  const bpmRetriever = new BpmDataRetriever();
  const bpmData: Array<BpmDataItem> = await bpmRetriever.getData();
  const serviceIdToServiceDataMap = new Map<string, ServiceDataItem>();
  bpmData.forEach((value) => {
    let parsedPrimaryService: Array<PrimaryServiceItem>;
    const primaryService: string = value.primaryService;
    try {
      parsedPrimaryService = JSON.parse(primaryService) as Array<PrimaryServiceItem>;
    } catch (ex) {
      console.error(`Failed to parse primaryService JSON array: ${primaryService}`, ex);
      return;
    }

    for (const item of parsedPrimaryService) {
      const { service_id, text } = item;
      if (service_id) {
        if (!serviceIdToServiceDataMap.has(service_id)) {
          if (serviceIdToTrustDataMap.has(service_id)) {
            const trustData = serviceIdToTrustDataMap.get(service_id);
            if (trustData) {
              const serviceData: ServiceDataItem = { ...trustData, mcirCount: 1 };
              serviceIdToServiceDataMap.set(service_id, serviceData);
            }
          }
        } else {
          const serviceData = serviceIdToServiceDataMap.get(service_id);
          if (serviceData) {
            serviceData.mcirCount += 1;
          }
        }
      } else if (serviceNameToTrustDataMap.has(text)) {
        if (serviceNameToTrustDataMap.has(text)) {
          const trustData = serviceNameToTrustDataMap.get(text);
          if (trustData) {
            if (!serviceIdToServiceDataMap.has(trustData.code)) {
              const serviceData: ServiceDataItem = { ...trustData, mcirCount: 1 };
              serviceIdToServiceDataMap.set(trustData.code, serviceData);
            } else {
              const serviceData = serviceIdToServiceDataMap.get(trustData.code);
              if (serviceData) {
                serviceData.mcirCount += 1;
              }
            }
          }
        }
      }
    }
  });

  const csvFilePath = path.resolve(__dirname, 'analysis-output.csv');
  const csvHeaders =
    'code,appId,name,division,tier,type,mcirCount,mttr,rpo,rto,slo,resiliencyRisk,spIssues,repos\n';
  fs.writeFileSync(csvFilePath, csvHeaders);
  serviceIdToServiceDataMap.forEach((value) => {
    const csvRow = `${value.code},${value.appId},${value.name},${value.division},${value.tier},${value.type},${value.mcirCount},${value.mttr},${value.rpo},${value.rto},${value.slo},${value.resiliencyRisk},${value.spIssues},${value.repos}\n`;
    fs.appendFileSync(csvFilePath, csvRow);
  });
}

main().catch((err) => {
  console.error('The GraphQL query encountered an error:', err);
});

module.exports = { main };
