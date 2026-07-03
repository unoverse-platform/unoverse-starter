import type { Meta, StoryObj } from "@storybook/react";
import ProfileReport from "./ProfileReport";
import { ProfileReportDefaults, mockProfileReportData } from "./defaults";

const meta: Meta<typeof ProfileReport> = {
  title: "Print/Pages/ProfileReport",
  component: ProfileReport,
  parameters: {
    layout: "centered",
    workflowSize: { width: 800, height: 1060 },
  },
  argTypes: {
    object: {
      control: "object",
      description: "Profile Report Data",
      workflowInput: true,
    },
  },
};

export default meta;
type Story = StoryObj<typeof ProfileReport>;

export const Default: Story = {
  args: ProfileReportDefaults,
};

export const FemaleWitness: Story = {
  args: {
    object: {
      ...mockProfileReportData,
      name: "Elena Vasquez-Reyes",
      aliases: "Lena, The Vintner's Wife",
      status: "Person of Interest",
      date_of_birth: "June 22, 1985",
      place_of_birth: "Mendoza, ARG",
      height: "5'6\"",
      weight: "135 lbs",
      build: "Slim",
      occupation: "Sommelier",
      scars_marks: "None noted",
      hair_color: "Black",
      coat_colors: "-",
      eye_color: "Dark Brown",
      sex: "Female",
      species: "Human",
      remarks:
        "Wife of the deceased. Discovered the body in the wine cellar at approximately 10:15 PM. Claims to have been greeting guests in the main hall prior. Multiple witnesses corroborate her presence at the gala but timeline has a 20-minute gap.",
      photo_url:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=400&fit=crop",
    },
  },
};
