import type { Meta, StoryObj } from "@storybook/react";
import AutopsyReport from "./AutopsyReport";
import { AutopsyReportDefaults, mockAutopsyReportData } from "./defaults";

const meta: Meta<typeof AutopsyReport> = {
  title: "Print/Pages/AutopsyReport",
  component: AutopsyReport,
  parameters: {
    layout: "centered",
    workflowSize: { width: 800, height: 1060 },
  },
  argTypes: {
    object: {
      control: "object",
      description: "Autopsy Report Data",
      workflowInput: true,
    },
  },
};

export default meta;
type Story = StoryObj<typeof AutopsyReport>;

export const Default: Story = {
  args: AutopsyReportDefaults,
};

export const AlternateCase: Story = {
  args: {
    object: {
      ...mockAutopsyReportData,
      decedent: "Jane Doe",
      race: "W",
      sex: "F",
      age: "34",
      time_of_death: "3:45 AM",
      place: "Riverside Park",
      type_of_death_trauma: "X",
      type_of_death_suicide: " ",
      type_of_death_suddenly: " ",
      type_of_death_found_dead: "X",
      type_of_death_suspicious: "X",
      type_of_death_unusual: " ",
      type_of_death_unnatural: "X",
      comment: "Decedent found by jogger near riverbank. Signs of struggle evident at scene.",
      body_height: "5'6\"",
      body_weight: "130lb",
      body_hair: "Blonde",
      body_eyes: "Blue",
      body_clothes: "Running gear",
      body_accessories: "Fitness watch",
      marks_and_wounds:
        "Blunt force trauma to posterior cranium. Defensive wounds on both forearms. Abrasions on palms consistent with fall onto gravel surface.",
      toxicology_results:
        "Blood alcohol level 0.02%. No controlled substances detected. Prescription antihistamine at therapeutic levels.",
      probable_cause_of_death: "Blunt force trauma to the head resulting in subdural hematoma and cerebral hemorrhage.",
      further_action: "Homicide investigation initiated. DNA samples collected from under fingernails for analysis.",
      date: "2024-11-05",
      place_of_investigation: "County Morgue",
      signature: "Dr. James Park, M.E.",
    },
  },
};
