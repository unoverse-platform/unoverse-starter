import React from "react";
import { InsightCards } from "../components/InsightCards";

export default function InsightsView({ evidence, composed }) {
  // v2 only - pass evidence and composed to InsightCards
  return <InsightCards evidence={evidence} composed={composed} />;
}
