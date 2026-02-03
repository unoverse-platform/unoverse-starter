import React from "react";
import { Heart, Lightbulb, TrendingUp, Clock, CheckCircle, Brain, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";
import { InterestBubbles } from "../components/InterestBubbles";
import { InsightCards } from "../components/InsightCards";
import { PersonalityRadar } from "../components/PersonalityRadar";

export function OverviewView({ evidence, composed }) {
  // v2 only - all data from evidence and composed understanding
  const userName = composed?.identity?.known?.name || composed?.identity?.inferred?.name || "User";
  const userEmail = composed?.identity?.known?.email;

  // Extract interests from v2 composed data
  const interests = (composed?.interests || []).map((i, index) => ({
    name: i.interest,
    weight: i.certainty || 0.9 - index * 0.1,
    reinforcementCount: i.reinforcementCount,
  }));

  // Get top 5 reinforced topics from evidence for radar chart
  const getTopReinforcedTopics = () => {
    if (!evidence || evidence.length === 0) return [];

    const topicCounts = {};
    evidence.forEach((e) => {
      if (e.domain === "needs" || e.domain === "interests") {
        const key = e.claim;
        if (!topicCounts[key]) {
          topicCounts[key] = { claim: e.claim, count: 0, domain: e.domain };
        }
        topicCounts[key].count += e.reinforcementCount || 1;
      }
    });

    return Object.values(topicCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((t) => ({
        trait: t.claim.replace("User wants ", "").replace("User is interested in ", ""),
        score: t.count,
      }));
  };

  const radarData = getTopReinforcedTopics();

  // Calculate engagement score from evidence count and certainty
  const calculateEngagementFromEvidence = () => {
    if (!evidence || evidence.length === 0) return 23;
    const avgCertainty = evidence.reduce((sum, e) => sum + (e.certainty || 0), 0) / evidence.length;
    const evidenceBonus = Math.min(evidence.length * 2, 40);
    return Math.min(Math.round(avgCertainty * 60 + evidenceBonus), 100);
  };

  const engagementScore = calculateEngagementFromEvidence();

  // Group evidence by type for Evidence Profile
  const evidenceByType = {
    explicit: evidence?.filter((e) => e.type === "explicit") || [],
    deductive: evidence?.filter((e) => e.type === "deductive") || [],
    inductive: evidence?.filter((e) => e.type === "inductive") || [],
    abductive: evidence?.filter((e) => e.type === "abductive") || [],
  };

  // Generate next steps from v2 composed needs
  const generateNextSteps = () => {
    const steps = [];

    if (composed?.currentNeeds && composed.currentNeeds.length > 0) {
      for (const need of composed.currentNeeds.slice(0, 3)) {
        steps.push({
          action: need.need,
          category: need.domain || "needs",
          priority: need.certainty >= 0.8 ? "high" : need.certainty >= 0.5 ? "medium" : "low",
          reason: `Certainty: ${Math.round(need.certainty * 100)}%`,
          certainty: need.certainty,
          cta: {
            text: "Take Action",
            link: "#",
          },
        });
      }
    }

    return { immediate: steps };
  };

  const nextSteps = generateNextSteps();

  return (
    <div className="space-y-6">
      {/* Business Readiness - Apple Style */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100"
        style={{ boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)" }}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg shadow-sm">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
            </div>
            Engagement Score
          </h3>
          <span className="text-3xl font-semibold text-gray-900">{engagementScore}%</span>
        </div>

        <div className="h-2 bg-gray-200/50 rounded-full overflow-hidden mb-4 shadow-inner">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${engagementScore}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-sm"
          />
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Stage</div>
            <div className="text-base font-medium text-gray-900">
              {evidence?.length > 10 ? "Active" : evidence?.length > 3 ? "Engaged" : "Exploring"}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Evidence</div>
            <div className="text-base font-medium text-gray-900">{evidence?.length || 0} pieces</div>
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Certainty</div>
            <div className="text-base font-medium text-gray-900">
              {evidence?.length > 0
                ? `${Math.round((evidence.reduce((sum, e) => sum + (e.certainty || 0), 0) / evidence.length) * 100)}%`
                : "N/A"}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Evidence Profile */}
      {evidence?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100"
          style={{ boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)" }}
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg">
              <Brain className="w-5 h-5 text-purple-600" />
            </div>
            Evidence Profile
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-blue-50 rounded-xl text-center"
            >
              <CheckCircle className="w-6 h-6 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-700">{evidenceByType.explicit.length}</p>
              <p className="text-xs text-blue-600">Explicit Facts</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-4 bg-green-50 rounded-xl text-center"
            >
              <Lightbulb className="w-6 h-6 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-700">{evidenceByType.deductive.length}</p>
              <p className="text-xs text-green-600">Deductions</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-4 bg-purple-50 rounded-xl text-center"
            >
              <Brain className="w-6 h-6 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-700">{evidenceByType.inductive.length}</p>
              <p className="text-xs text-purple-600">Patterns</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-4 bg-orange-50 rounded-xl text-center"
            >
              <HelpCircle className="w-6 h-6 text-orange-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-orange-700">{evidenceByType.abductive.length}</p>
              <p className="text-xs text-orange-600">Hypotheses</p>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Top Topics Radar Chart */}
      {radarData.length >= 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100"
          style={{ boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)" }}
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
            </div>
            Top Topics
          </h3>
          <p className="text-sm text-gray-500 mb-4">Based on conversation frequency</p>
          <PersonalityRadar data={radarData} compact />
        </motion.div>
      )}

      {/* Hypotheses */}
      {evidenceByType.abductive.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100"
          style={{ boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)" }}
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg">
              <HelpCircle className="w-5 h-5 text-orange-600" />
            </div>
            Hypotheses
          </h3>
          <div className="space-y-3">
            {evidenceByType.abductive.slice(0, 5).map((hyp, index) => (
              <motion.div
                key={hyp.id || index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 bg-orange-50/50 rounded-xl border border-orange-100 flex items-center justify-between"
              >
                <p className="text-gray-700 text-sm flex-1">{hyp.claim}</p>
                <span className="ml-4 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                  {Math.round((hyp.certainty || 0.5) * 100)}%
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
