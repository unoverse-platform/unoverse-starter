import type { ProfileReportData } from "./types";

export const mockProfileReportData: ProfileReportData = {
  name: "Gavin Thornwood",
  aliases: "Gav, The Heir, Young Thornwood",
  status: "Suspect",
  date_of_birth: "March 15, 1982",
  place_of_birth: "Napa Valley, CA",
  height: "6'1\"",
  weight: "185 lbs",
  build: "Athletic",
  occupation: "Heir Apparent",
  scars_marks: "Scar above left brow",
  hair_color: "Dark Brown",
  coat_colors: "-",
  eye_color: "Steel Gray",
  sex: "Male",
  species: "Human",
  remarks:
    "Eldest son of the Thornwood estate, managing vineyard expansion projects. Was hosting a toast at the gala during the critical timeframe. Appeared notably composed and collected during initial questioning.",
  photo_url:
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop",
};

export const ProfileReportDefaults = {
  object: mockProfileReportData,
};
