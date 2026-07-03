export interface AutopsyReportData {
  decedent: string;
  race: string;
  sex: string;
  age: string;
  time_of_death: string;
  place: string;
  type_of_death_trauma: string;
  type_of_death_suicide: string;
  type_of_death_suddenly: string;
  type_of_death_found_dead: string;
  type_of_death_suspicious: string;
  type_of_death_unusual: string;
  type_of_death_unnatural: string;
  comment: string;
  body_height: string;
  body_weight: string;
  body_hair: string;
  body_eyes: string;
  body_clothes: string;
  body_accessories: string;
  marks_and_wounds: string;
  toxicology_results: string;
  probable_cause_of_death: string;
  further_action: string;
  date: string;
  place_of_investigation: string;
  signature: string;
}

export interface AutopsyReportProps {
  object?: AutopsyReportData;
}
