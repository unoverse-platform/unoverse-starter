/**
 * Default values for StatCard component
 * Used only in Storybook for demos and by templates' mock clients
 */

export const StatCardDefaults = {
  label: "Monthly Revenue",
  value: "48,250",
  prefix: "$",
  delta: { value: "12.4%", direction: "up", label: "vs last month" },
  sparkline: [28, 31, 30, 34, 33, 39, 41, 44, 43, 48],
  icon: "💰",
  caption: "Updated 2m ago",
  accentColor: "var(--color-chart-1)",
};
