import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, CheckCircle, Lightbulb, Brain, HelpCircle, TrendingUp, ChevronDown, ChevronRight } from "lucide-react";
import { ConversationTimeline } from "../components/ConversationTimeline";

export default function TimelineView({ evidence, composed }) {
  const [expandedDates, setExpandedDates] = useState({});

  const toggleDate = (date) => {
    setExpandedDates((prev) => ({ ...prev, [date]: !prev[date] }));
  };

  // v2 only - show evidence timeline sorted by date
  const sortedEvidence = [...(evidence || [])].sort(
    (a, b) => new Date(b.lastReinforced || b.firstObserved) - new Date(a.lastReinforced || a.firstObserved),
  );

  // Parse sentiment from claim text: "User sentiment: positive - reason"
  const parseSentiment = (claim, domain) => {
    if (domain !== "sentiment") return { sentiment: "neutral", score: 0.5 };

    const lowerClaim = claim.toLowerCase();
    if (lowerClaim.includes("sentiment: positive")) {
      return { sentiment: "positive", score: 1.0 };
    } else if (lowerClaim.includes("sentiment: negative")) {
      return { sentiment: "negative", score: 0.0 };
    }
    return { sentiment: "neutral", score: 0.5 };
  };

  // Convert evidence to memories format for ConversationTimeline chart
  // Use sentiment score (0-1) as importance for the chart
  const memoriesForChart = sortedEvidence
    .filter((e) => e.domain === "sentiment") // Only show sentiment evidence on chart
    .map((e) => {
      const { sentiment, score } = parseSentiment(e.claim, e.domain);
      return {
        id: e.id,
        timestamp: e.lastReinforced || e.firstObserved,
        content: {
          summary: e.claim,
          importance: score, // 0 = negative, 0.5 = neutral, 1 = positive
          sentiment: sentiment,
          tags: [e.domain, e.type],
        },
      };
    });

  // Group by date for visual grouping
  const groupByDate = (items) => {
    const groups = {};
    items.forEach((item) => {
      const date = new Date(item.lastReinforced || item.firstObserved).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(item);
    });
    return groups;
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "explicit":
        return <CheckCircle className="w-4 h-4" />;
      case "deductive":
        return <Lightbulb className="w-4 h-4" />;
      case "inductive":
        return <Brain className="w-4 h-4" />;
      case "abductive":
        return <HelpCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "explicit":
        return { bg: "bg-blue-500", light: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" };
      case "deductive":
        return { bg: "bg-green-500", light: "bg-green-50", text: "text-green-600", border: "border-green-200" };
      case "inductive":
        return { bg: "bg-purple-500", light: "bg-purple-50", text: "text-purple-600", border: "border-purple-200" };
      case "abductive":
        return { bg: "bg-orange-500", light: "bg-orange-50", text: "text-orange-600", border: "border-orange-200" };
      default:
        return { bg: "bg-gray-500", light: "bg-gray-50", text: "text-gray-600", border: "border-gray-200" };
    }
  };

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  if (sortedEvidence.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="w-10 h-10 text-gray-400" />
        </div>
        <p className="text-gray-600 text-lg font-medium mb-2">No timeline data yet</p>
        <p className="text-gray-400 text-sm">Evidence will appear here as you interact</p>
      </div>
    );
  }

  const groupedEvidence = groupByDate(sortedEvidence.slice(0, 30));

  return (
    <div className="space-y-6">
      {/* Timeline Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold mb-1">Evidence Timeline</h3>
            <p className="text-indigo-100">Your journey of insights and discoveries</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{sortedEvidence.length}</div>
            <div className="text-indigo-200 text-sm">Total Evidence</div>
          </div>
        </div>

        {/* Type Legend */}
        <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-white/20">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-blue-300" />
            <span>Explicit</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-green-300" />
            <span>Deductive</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-purple-300" />
            <span>Inductive</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-orange-300" />
            <span>Abductive</span>
          </div>
        </div>
      </div>

      {/* Sentiment Chart */}
      {memoriesForChart.length > 0 ? (
        <div className="bg-white rounded-2xl p-6 shadow-sm" style={{ boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)" }}>
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Sentiment Over Time</h4>
          <p className="text-sm text-gray-500 mb-4">
            Tracking emotional state: 100% = Positive, 50% = Neutral, 0% = Negative
          </p>
          <ConversationTimeline memories={memoriesForChart} />
        </div>
      ) : (
        <div
          className="bg-white rounded-2xl p-6 shadow-sm text-center"
          style={{ boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)" }}
        >
          <h4 className="text-lg font-semibold text-gray-800 mb-2">Sentiment Over Time</h4>
          <p className="text-sm text-gray-400">
            No sentiment data yet. Sentiment will be tracked from new conversations.
          </p>
        </div>
      )}

      {/* Timeline List */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-200 via-purple-200 to-gray-200" />

        {Object.entries(groupedEvidence).map(([date, items], groupIndex) => {
          const isExpanded = expandedDates[date] !== false; // Default to expanded
          return (
            <div key={date} className="mb-8">
              {/* Date Header - Clickable */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: groupIndex * 0.1 }}
                className="flex items-center gap-4 mb-4 cursor-pointer group"
                onClick={() => toggleDate(date)}
              >
                <div className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center z-10 border-2 border-indigo-200 group-hover:border-indigo-400 transition-colors">
                  <Clock className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <h4 className="text-lg font-semibold text-gray-800">{date}</h4>
                  <span className="text-sm text-gray-400">({items.length} items)</span>
                </div>
                <div className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </motion.div>

              {/* Events for this date - Collapsible */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="ml-16 space-y-3 overflow-hidden"
                  >
                    {items.map((e, i) => {
                      const colors = getTypeColor(e.type);
                      return (
                        <motion.div
                          key={e.id || `${groupIndex}-${i}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: groupIndex * 0.1 + i * 0.05 }}
                          className={`bg-white rounded-xl p-4 shadow-sm border ${colors.border} hover:shadow-md transition-shadow`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${colors.light} ${colors.text}`}>{getTypeIcon(e.type)}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-gray-800 font-medium">{e.claim}</p>
                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors.light} ${colors.text}`}
                                >
                                  {e.type}
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                                  {e.domain}
                                </span>
                                {e.reinforcementCount > 1 && (
                                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-50 text-amber-600">
                                    <TrendingUp className="w-3 h-3" />
                                    {e.reinforcementCount}x reinforced
                                  </span>
                                )}
                                <span className="text-xs text-gray-400 ml-auto">
                                  {formatTime(e.lastReinforced || e.firstObserved)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
