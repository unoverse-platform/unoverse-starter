import type { Meta, StoryObj } from "@storybook/react";
import PoliceReport from "./PoliceReport";
import { PoliceReportDefaults, mockPoliceReportData } from "./defaults";

const meta: Meta<typeof PoliceReport> = {
  title: "Print/Pages/PoliceReport",
  component: PoliceReport,
  parameters: {
    layout: "centered",
    workflowSize: { width: 800, height: 2120 },
  },
  argTypes: {
    object: {
      control: "object",
      description: "Police Report Data",
      workflowInput: true,
    },
  },
};

export default meta;
type Story = StoryObj<typeof PoliceReport>;

export const Default: Story = {
  args: PoliceReportDefaults,
};

export const ShortContent: Story = {
  args: {
    object: {
      ...mockPoliceReportData,
      incident_summary: "Officers responded to a report of an unresponsive male. Victim pronounced deceased at scene.",
      victim_information: "John Doe, Male, Age 45. Found at the scene.",
      scene_description: "Indoor location, no signs of forced entry.",
      discovery_details: "Body discovered by a guest at approximately 2245 hours.",
      initial_findings: "Cause of death pending autopsy results.",
      next_steps: "Autopsy scheduled. Witness interviews to follow.",
    },
  },
};

export const LongContent: Story = {
  args: {
    object: {
      ...mockPoliceReportData,
      incident_summary:
        "At approximately 2247 hours on October 12, 2024, officers responded to a 911 call reporting an unresponsive male at the Blackwell Estate during the annual Harvest Gala. Upon arrival, the victim was found in the wine cellar, lying face-down near the reserve collection. Paramedics pronounced the victim deceased at the scene at 2303 hours. The area was immediately secured and designated a crime scene. Approximately 140 guests were present at the gala at the time of discovery. Initial assessment suggests suspicious circumstances warranting homicide investigation. Multiple witnesses reported hearing a loud argument in the vicinity of the cellar entrance between 2100 and 2130 hours. Estate security confirmed that the cellar access door had been propped open earlier in the evening for wine service. This is additional text to test how the component handles very long content that would have broken the Abyssale template with its strict character limits.",
      scene_description:
        "The wine cellar is a temperature-controlled underground facility accessed via a single staircase from the main tasting room. The victim was found approximately 15 feet from the entrance, between two rows of oak barrels. A shattered wine glass was found near the body. No signs of forced entry. The cellar door was unlocked at the time of discovery. Security cameras in the hallway above were operational. The cellar itself has no camera coverage. Additional items of note: a partially consumed bottle of 2018 Reserve Cabernet was found open on a nearby barrel top, and a set of keys belonging to the victim was found on the floor approximately 3 feet from the body. Temperature in the cellar was recorded at 58°F, consistent with normal operating conditions.",
    },
  },
};
