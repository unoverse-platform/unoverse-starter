/**
 * Default values for MetricGrid component
 * Used only in Storybook for demos and by templates' mock clients
 */

export const MetricGridDefaults = {
  title: "This month at a glance",
  metrics: [
    {
      label: "Revenue",
      value: "48,250",
      prefix: "$",
      delta: { value: "12.4%", direction: "up", label: "MoM" },
      icon: "💰",
      accentColor: "var(--color-chart-1)",
    },
    {
      label: "New Customers",
      value: "312",
      delta: { value: "5.1%", direction: "up", label: "MoM" },
      icon: "👥",
      accentColor: "var(--color-chart-2)",
    },
    {
      label: "Churn",
      value: "2.3",
      suffix: "%",
      invertDelta: true,
      delta: { value: "-0.4pp", direction: "down", label: "MoM" },
      icon: "📉",
      accentColor: "var(--color-chart-3)",
    },
    {
      label: "Avg Order Value",
      value: "154",
      prefix: "$",
      delta: { value: "0%", direction: "neutral", label: "flat" },
      icon: "🛒",
      accentColor: "var(--color-chart-4)",
    },
  ],
};
