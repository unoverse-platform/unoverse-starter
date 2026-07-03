export interface StatementReportData {
  suspect_id: string;
  suspect_name: string;
  case_no: string;
  date: string;
  reporting_officer: string;
  filed_by: string;
  statement_text: string;
  signature: string;
  signature_date: string;
}

export interface StatementReportProps {
  object?: StatementReportData;
}
