/**
 * Default values for TrendChart component
 * Used only in Storybook for demos and by templates' mock clients
 */

export const TrendChartDefaults = {
  title: "Revenue — last 12 weeks",
  data: [28, 31, 30, 34, 33, 39, 37, 42, 41, 45, 44, 49],
  labels: ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8", "W9", "W10", "W11", "W12"],
  color: "var(--color-chart-1)",
  area: true,
  showDots: false,
  valuePrefix: "$",
  valueSuffix: "k",
};
