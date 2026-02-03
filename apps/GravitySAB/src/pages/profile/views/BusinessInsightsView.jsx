import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, Target, CheckCircle } from "lucide-react";

/**
 * BusinessInsightsView Component - v2 Evidence-based
 */
export default function BusinessInsightsView({ evidence, composed }) {
  // Calculate engagement from evidence
  const engagementScore =
    evidence?.length > 0
      ? Math.min(
          Math.round(
            (evidence.reduce((sum, e) => sum + (e.certainty || 0.5), 0) / evidence.length) * 60 +
              Math.min(evidence.length * 2, 40),
          ),
          100,
        )
      : 23;

  // Get needs from composed
  const currentNeeds = composed?.currentNeeds || [];
  const hypotheses = composed?.hypotheses || [];

  return (
    <div className="space-y-6">
      {/* Engagement Score */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            Engagement Score
          </h3>
          <span className="text-3xl font-semibold text-gray-900">{engagementScore}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${engagementScore}%` }}
            transition={{ duration: 1 }}
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
          />
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
          <div>
            <p className="text-gray-500">Evidence</p>
            <p className="font-medium">{evidence?.length || 0} pieces</p>
          </div>
          <div>
            <p className="text-gray-500">Needs</p>
            <p className="font-medium">{currentNeeds.length} identified</p>
          </div>
          <div>
            <p className="text-gray-500">Hypotheses</p>
            <p className="font-medium">{hypotheses.length} active</p>
          </div>
        </div>
      </motion.div>

      {/* Current Needs */}
      {currentNeeds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            Current Needs
          </h3>
          <div className="space-y-3">
            {currentNeeds.map((need, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">{need.need}</span>
                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                    {Math.round((need.certainty || 0.5) * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Hypotheses */}
      {hypotheses.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Hypotheses
          </h3>
          <div className="space-y-3">
            {hypotheses.map((h, i) => (
              <div key={i} className="p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">{h.hypothesis}</span>
                  <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded">
                    {Math.round((h.certainty || 0.5) * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
