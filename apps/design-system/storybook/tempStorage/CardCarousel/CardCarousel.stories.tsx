import type { Meta, StoryObj } from "@storybook/react";
import CardCarousel from "./CardCarousel";
import { CardCarouselDefaults } from "./defaults";

const meta: Meta<typeof CardCarousel> = {
  title: "Components/CardCarousel",
  component: CardCarousel,
  parameters: {
    layout: "fullscreen",
    workflowSize: { width: 900, height: 400 },
  },
  decorators: [
    (Story) => (
      <div style={{ padding: "20px", background: "#f5f5f5" }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    // ✅ Workflow inputs - data from AI
    items: {
      control: "object",
      description: "Array of card items to display (from PostgresFetch or similar)",
      workflowInput: true,
    },
    // ❌ Template props - NOT workflow inputs
    onCardClick: {
      action: "cardClicked",
      description: "Callback when a card is clicked",
      workflowInput: false,
    },
  },
};

export default meta;
type Story = StoryObj<typeof CardCarousel>;

export const Default: Story = {
  args: {
    items: CardCarouselDefaults.items,
  },
};

export const SingleItem: Story = {
  args: {
    items: [CardCarouselDefaults.items[0]],
  },
};

export const ManyItems: Story = {
  args: {
    items: [...CardCarouselDefaults.items, ...CardCarouselDefaults.items],
  },
};

export const NoImages: Story = {
  args: {
    items: CardCarouselDefaults.items.map((item) => ({
      ...item,
      image: undefined,
      metadata: { ...item.metadata, images: undefined },
    })),
  },
};
