/**
 * Default values for BarChart component
 * Used only in Storybook for demos and by templates' mock clients
 */

export const BarChartDefaults = {
  title: "Revenue by channel",
  orientation: "vertical",
  valuePrefix: "$",
  valueSuffix: "k",
  showValues: true,
  data: [
    { label: "Direct", value: 42 },
    { label: "Organic", value: 31 },
    { label: "Paid", value: 27 },
    { label: "Referral", value: 18 },
    { label: "Social", value: 12 },
  ],
};
