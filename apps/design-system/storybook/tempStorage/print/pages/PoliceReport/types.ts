export interface PoliceReportData {
  case_number: string;
  date: string;
  reporting_officer: string;
  location: string;
  incident_summary: string;
  victim_information: string;
  scene_description: string;
  discovery_details: string;
  initial_findings: string;
  next_steps: string;
  signature?: string;
  signature_title?: string;
  badge_number?: string;
}

export interface PoliceReportProps {
  object?: PoliceReportData;
}
