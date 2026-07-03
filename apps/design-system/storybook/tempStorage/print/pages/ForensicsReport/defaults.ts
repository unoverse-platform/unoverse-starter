import type { ForensicsReportData } from "./types";

export const mockForensicsReportData: ForensicsReportData = {
  lab_number: "FL-2024-1012",
  case_number: "VHL-2024-1012",
  date_received: "October 13, 2024",
  date_reported: "October 15, 2024",
  requesting_agency: "County Sheriff's Department - Major Crimes Unit",
  examiner_name: "Dr. Rebecca Chen, Ph.D., Forensic Toxicology",
  item_1_number: "FOR_001",
  item_1_description:
    "Wine glass with residual liquid recovered from cellar floor near victim",
  item_1_method: "Gas Chromatography-Mass Spectrometry (GC-MS) analysis",
  item_1_result:
    "Lethal concentration of pharmaceutical-grade compound detected. Substance requires controlled laboratory access. No latent fingerprints recovered.",
  item_2_number: "FOR_002",
  item_2_description:
    "Victim blood and tissue samples collected during autopsy examination",
  item_2_method: "Toxicological screening and quantitative analysis",
  item_2_result:
    "Fatal dosage confirmed in bloodstream. Compound typically restricted to pharmaceutical research facilities. Death within 5-8 minutes of ingestion.",
  item_3_number: "FOR_003",
  item_3_description:
    "Footprint impressions on stone cellar floor near exterior access door",
  item_3_method: "Forensic impression analysis and pattern comparison",
  item_3_result:
    "Multiple partial prints identified. Tread pattern consistent with common athletic footwear, size range 8-10. Direction indicates exit pathway.",
  item_4_number: "FOR_004",
  item_4_description:
    "Soil samples and footprint casts from vineyard path adjacent to cellar",
  item_4_method: "Impression casting and comparative tread analysis",
  item_4_result:
    "Fresh impressions match pattern from cellar floor. Gait analysis suggests rapid movement. Timeline consistent with evening of incident.",
  conclusion:
    "Evidence confirms intentional poisoning using restricted pharmaceutical compound. Perpetrator requires specialized knowledge and controlled substance access. Footprint evidence indicates hasty departure. Further investigation of individuals with relevant expertise recommended.",
  signature: "Dr. Rebecca Chen, Ph.D.",
};

export const ForensicsReportDefaults = {
  object: mockForensicsReportData,
};
