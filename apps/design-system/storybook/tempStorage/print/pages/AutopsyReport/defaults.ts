import type { AutopsyReportData } from "./types";

export const mockAutopsyReportData: AutopsyReportData = {
  decedent: "Antonio Reyes",
  race: "H",
  sex: "M",
  age: "52",
  time_of_death: "10:12 PM",
  place: "Wine Cellar",
  type_of_death_trauma: " ",
  type_of_death_suicide: " ",
  type_of_death_suddenly: " ",
  type_of_death_found_dead: "X",
  type_of_death_suspicious: "X",
  type_of_death_unusual: " ",
  type_of_death_unnatural: "X",
  comment: "Decedent discovered in wine cellar during harvest gala event. Emergency services notified at scene.",
  body_height: "5'10\"",
  body_weight: "175lb",
  body_hair: "Black",
  body_eyes: "Brown",
  body_clothes: "Formal attire",
  body_accessories: "Wristwatch",
  marks_and_wounds:
    "No external trauma observed. Perioral cyanosis present. Petechial hemorrhaging in conjunctiva. Oral mucosa shows mild irritation consistent with chemical exposure.",
  toxicology_results:
    "Lethal concentration of organophosphate compound detected in blood and tissue samples. Substance consistent with agricultural pesticide chemicals.",
  probable_cause_of_death: "Acute poisoning from ingestion of toxic organophosphate compound administered via wine.",
  further_action:
    "Homicide investigation recommended. Wine samples and cellar evidence retained for criminal analysis.",
  date: "2024-10-13",
  place_of_investigation: "Napa County Morgue",
  signature: "Dr. Sarah Chen, M.E.",
};

export const AutopsyReportDefaults = {
  object: mockAutopsyReportData,
};
