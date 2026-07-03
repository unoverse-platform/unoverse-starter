export interface ForensicsReportData {
  lab_number: string;
  case_number: string;
  date_received: string;
  date_reported: string;
  requesting_agency: string;
  examiner_name: string;
  item_1_number: string;
  item_1_description: string;
  item_1_method: string;
  item_1_result: string;
  item_2_number: string;
  item_2_description: string;
  item_2_method: string;
  item_2_result: string;
  item_3_number: string;
  item_3_description: string;
  item_3_method: string;
  item_3_result: string;
  item_4_number: string;
  item_4_description: string;
  item_4_method: string;
  item_4_result: string;
  conclusion: string;
  signature: string;
}

export interface ForensicsReportProps {
  object?: ForensicsReportData;
}
