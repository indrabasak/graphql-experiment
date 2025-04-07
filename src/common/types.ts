export interface AuthBody {
  token_type: string;
  access_token: string;
  expires_in: number;
}

export interface TrustDataBody {
  data: {
    getApplicationsMetadata: Array<TrustData>;
    getApplicationsStats: Array<ApplicationStatDataItem>;
    getApplicationsSecurityIssuesCounts: Array<ApplicationSecurityIssueCountItem>;
    getApplicationsXtra: Array<ApplicationsXtraItem>;
  };
}

export interface TrustData {
  appId: string;
  code: string;
  division: string;
  name: string;
  status: string;
  tier: string;
  type: string;
  mttr: string | null;
  rpo: string | null;
  rto: string | null;
  slo: string | null;
  resiliencyRisk: string | null;
  spIssues: number;
  repos: string | null;
}

export interface ApplicationStatDataItem {
  appId: string;
  mttr: string | null;
  rpo: string | null;
  rto: string | null;
  slo: string | null;
  resiliencyRisk: string | null;
}

export interface ApplicationSecurityIssueCountItem {
  appId: string;
  vmCount: string;
}

export interface ApplicationsXtraItem {
  appId: string;
  repos: string | null;
}

///////////////////
export interface BpmDataItem {
  bpmDate: string;
  id: string;
  primaryService: string;
  categories: string;
  incidentType: string;
  detection_source: string;
  fyQtr: string;
  status: string;
}

export interface BpmDataBody {
  data: {
    getBPMTracker: {
      LastEvaluatedKey: {
        partitionKey: string;
        sortKey: string;
      };
      Items: Array<BpmDataItem>;
    };
  };
}

export interface PrimaryServiceItem {
  value: string;
  text: string;
  service_id: string;
  service_alias: string;
}

export interface ServiceDataItem extends TrustData {
  mcirCount: number;
}
