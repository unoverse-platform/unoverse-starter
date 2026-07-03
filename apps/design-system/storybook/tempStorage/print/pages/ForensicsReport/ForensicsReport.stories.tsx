import type { Meta, StoryObj } from "@storybook/react";
import ForensicsReport from "./ForensicsReport";
import { ForensicsReportDefaults, mockForensicsReportData } from "./defaults";

const meta: Meta<typeof ForensicsReport> = {
  title: "Print/Pages/ForensicsReport",
  component: ForensicsReport,
  parameters: {
    layout: "centered",
    workflowSize: { width: 1060, height: 820 },
  },
  argTypes: {
    object: {
      control: "object",
      description: "Forensics Report Data",
      workflowInput: true,
    },
  },
};

export default meta;
type Story = StoryObj<typeof ForensicsReport>;

export const Default: Story = {
  args: ForensicsReportDefaults,
};

export const AlternateCase: Story = {
  args: {
    object: {
      ...mockForensicsReportData,
      lab_number: "FL-2024-2087",
      case_number: "VHL-2024-2087",
      date_received: "November 3, 2024",
      date_reported: "November 5, 2024",
      requesting_agency: "State Police - Forensic Investigation Unit",
      examiner_name: "Dr. James Park, Ph.D., Trace Evidence",
      item_1_number: "FOR_010",
      item_1_description: "Fiber samples recovered from victim's clothing",
      item_1_method: "Polarized light microscopy and FTIR spectroscopy",
      item_1_result: "Synthetic fibers consistent with automotive carpet material. Color: dark grey.",
      item_2_number: "FOR_011",
      item_2_description: "Paint transfer on victim's jacket sleeve",
      item_2_method: "Cross-section analysis and spectral comparison",
      item_2_result: "Three-layer automotive paint. Matches manufacturer database for 2019-2022 sedan models.",
      item_3_number: "FOR_012",
      item_3_description: "Glass fragments embedded in roadway surface",
      item_3_method: "Refractive index measurement and elemental analysis",
      item_3_result: "Tempered glass consistent with headlamp assembly. Manufacturer identified.",
      item_4_number: "FOR_013",
      item_4_description: "Tire impression from scene perimeter",
      item_4_method: "Photographic overlay and tread pattern database comparison",
      item_4_result: "Tread pattern matches common all-season tire. Wear pattern suggests front-left mounting.",
      conclusion:
        "Physical evidence is consistent with a vehicle-pedestrian collision. Trace evidence narrows vehicle type. Recommend cross-referencing with DMV records for matching vehicle descriptions in the area.",
      signature: "Dr. James Park, Ph.D.",
    },
  },
};
