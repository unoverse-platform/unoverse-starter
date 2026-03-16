import type { Meta, StoryObj } from "@storybook/react";
import NewspaperPage from "./NewspaperPage";

const meta: Meta<typeof NewspaperPage> = {
  title: "Print/Pages/NewspaperPage",
  component: NewspaperPage,
  parameters: {
    layout: "centered",
    workflowSize: { width: 1060, height: 3300 },
  },
  argTypes: {
    mainArticles: {
      control: "object",
      description: "Main Articles JSON — Articles 1 & 7 (main story + continuation)",
      workflowInput: true,
    },
    obituary: {
      control: "object",
      description: "Obituary JSON — Article 8",
      workflowInput: true,
    },
    featureArticles: {
      control: "object",
      description: "Feature Articles JSON — Articles 2, 4, 6 (local feature, cameo, filler)",
      workflowInput: true,
    },
    newsArticles: {
      control: "object",
      description: "News Articles JSON — Articles 3 & 5 (red herring + secondary news)",
      workflowInput: true,
    },
    components: {
      control: "object",
      description:
        "Components JSON — masthead, banner, sheriff, editor, horoscopes, bestsellers, classifieds (optional, uses generic default)",
      workflowInput: true,
    },
    images: {
      control: "object",
      description:
        "Array of 4 image URLs — [article2_photo, article7_photo_left, article7_photo_right, article8_photo]",
      workflowInput: true,
    },
  },
};

export default meta;

export const Default: StoryObj<typeof NewspaperPage> = {
  args: {},
};
