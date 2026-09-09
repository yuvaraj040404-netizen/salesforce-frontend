export interface SalesforceRecord {
  Id: string;
  [key: string]: any;
}

export interface SalesforceResponse {
  totalSize: number;
  done: boolean;
  records: SalesforceRecord[];
}