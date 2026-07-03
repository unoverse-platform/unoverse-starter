export interface ProfileReportData {
  name: string;
  aliases: string;
  status: string;
  date_of_birth: string;
  place_of_birth: string;
  height: string;
  weight: string;
  build: string;
  occupation: string;
  scars_marks: string;
  hair_color: string;
  coat_colors: string;
  eye_color: string;
  sex: string;
  species: string;
  remarks: string;
  photo_url: string;
}

export interface ProfileReportProps {
  object?: ProfileReportData;
}
