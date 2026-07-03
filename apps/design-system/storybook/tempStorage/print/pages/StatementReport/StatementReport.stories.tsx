import type { Meta, StoryObj } from "@storybook/react";
import StatementReport from "./StatementReport";
import { StatementReportDefaults, mockStatementReportData } from "./defaults";

const meta: Meta<typeof StatementReport> = {
  title: "Print/Pages/StatementReport",
  component: StatementReport,
  parameters: {
    layout: "centered",
    workflowSize: { width: 800, height: 1060 },
  },
  argTypes: {
    object: {
      control: "object",
      description: "Statement Report Data",
      workflowInput: true,
    },
  },
};

export default meta;
type Story = StoryObj<typeof StatementReport>;

export const Default: Story = {
  args: StatementReportDefaults,
};

export const AlternateWitness: Story = {
  args: {
    object: {
      ...mockStatementReportData,
      suspect_id: "sus_elena",
      suspect_name: "Elena Vasquez-Reyes",
      case_no: "HOM-2024-1012",
      date: "October 14, 2024",
      reporting_officer: "Det. James Cooper",
      filed_by: "Napa County Sheriff",
      statement_text:
        'Subject Elena Vasquez-Reyes appeared visibly distressed during the interview, frequently dabbing her eyes with a handkerchief. She was dressed in a black evening gown, consistent with attendance at the harvest gala.\n\nSubject stated she had been greeting guests in the main hall for most of the evening. She described her relationship with the deceased as "deeply loving" and became emotional when recounting their last conversation earlier that day about plans for the upcoming harvest season.\n\nWhen asked about the timeline, subject indicated she left the main hall at approximately 9:55 PM to check on wine service in the cellar. She stated, "I found him there, on the floor, and I screamed." Subject claims to have immediately called for help.\n\nHowever, multiple witnesses place subject in an animated discussion with an unidentified male near the garden terrace between 9:30 and 9:50 PM, which subject did not mention voluntarily. When confronted with this information, subject paused for several seconds before stating the conversation was "nothing important, just a guest asking about wine pairings."\n\nSubject expressed full willingness to cooperate and provided her phone for examination without hesitation.',
      signature: "Detective James Cooper",
      signature_date: "October 14, 2024",
    },
  },
};
