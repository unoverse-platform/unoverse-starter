import type { PoliceReportData } from "./types";

export const mockPoliceReportData: PoliceReportData = {
  case_number: "CC-2024-04817",
  date: "October 13, 2024",
  reporting_officer: "Det. Marcus Webb, Badge #4471",
  location: "Blackwell Estate & Vineyard, 1847 Silverado Trail, Napa Valley, CA",
  incident_summary:
    "At approximately 2247 hours on October 12, 2024, officers responded to a 911 call reporting an unresponsive male at the Blackwell Estate during the annual Harvest Gala. Upon arrival, the victim was found in the wine cellar, lying face-down near the reserve collection. Paramedics pronounced the victim deceased at the scene at 2303 hours. The area was immediately secured and designated a crime scene. Approximately 140 guests were present at the gala at the time of discovery. Initial assessment suggests suspicious circumstances warranting homicide investigation.",
  victim_information:
    "Antonio Reyes, Male, Age 52. Estate Manager at Blackwell Vineyard for 18 years. Found wearing a dark suit consistent with gala attire. No visible signs of trauma or struggle. Wallet and personal effects found intact on person. Next of kin: Maria Reyes (sister), notified at 0115 hours on October 13.",
  scene_description:
    "The wine cellar is a temperature-controlled underground facility accessed via a single staircase from the main tasting room. The victim was found approximately 15 feet from the entrance, between two rows of oak barrels. A shattered wine glass was found near the body. No signs of forced entry. The cellar door was unlocked at the time of discovery. Security cameras in the hallway above were operational. The cellar itself has no camera coverage.",
  discovery_details:
    "The body was discovered by Sophia Blackwell, daughter of estate owner Richard Blackwell, at approximately 2245 hours. Ms. Blackwell stated she went to the cellar to retrieve a specific bottle of wine for her father and found the victim unresponsive on the floor. She immediately returned upstairs and alerted security staff, who called 911. Ms. Blackwell appeared visibly distressed and was treated for shock by paramedics on scene.",
  initial_findings:
    "Preliminary examination by the Medical Examiner suggests death occurred between 2100 and 2200 hours, approximately 45-90 minutes before discovery. No obvious cause of death was apparent upon external examination. Toxicology screening has been ordered. The shattered wine glass near the body has been collected as evidence. Fingerprint analysis of the cellar door handle and surrounding surfaces is pending. Guest list and staff roster have been secured from event coordinator.",
  next_steps:
    "Full autopsy scheduled for October 14, 2024. Interview all persons of interest identified from guest list and staff. Review security camera footage from all estate cameras for the period of 2000-2300 hours. Obtain phone records for victim and key persons of interest. Process all physical evidence collected from the scene. Coordinate with forensics lab for expedited toxicology results. Canvass surrounding properties for additional camera footage.",
  signature: "Det. Marcus Webb",
  signature_title: "Lead Detective, Homicide Division",
  badge_number: "#4471",
};

export const PoliceReportDefaults = {
  object: mockPoliceReportData,
};
