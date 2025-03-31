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
