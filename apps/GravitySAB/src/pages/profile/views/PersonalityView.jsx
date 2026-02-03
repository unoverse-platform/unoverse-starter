import React from "react";
import { motion } from "framer-motion";
import { Brain, CheckCircle, Lightbulb, HelpCircle } from "lucide-react";

export default function PersonalityView({ evidence, composed }) {
  // v2 only - extract data from evidence by domain
  const interestEvidence = evidence?.filter((e) => e.domain === "interests") || [];
  const behaviorEvidence = evidence?.filter((e) => e.domain === "behavior") || [];
  const identityEvidence = evidence?.filter((e) => e.domain === "identity") || [];

  // Get identity from composed
  const identity = composed?.identity || { known: {}, inferred: {} };

  // Group evidence by type for display
  const evidenceByType = {
    explicit: evidence?.filter((e) => e.type === "explicit") || [],
    deductive: evidence?.filter((e) => e.type === "deductive") || [],
    inductive: evidence?.filter((e) => e.type === "inductive") || [],
    abductive: evidence?.filter((e) => e.type === "abductive") || [],
  };

  const hasEvidence = evidence?.length > 0;

  return (
    <div className="space-y-6">
      {/* Evidence Overview */}
      <div className="bg-white rounded-2xl p-8 shadow-sm" style={{ boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)" }}>
        <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Brain className="w-6 h-6 text-purple-600" />
          Evidence Profile
        </h3>

        {hasEvidence ? (
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
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Brain className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-600 text-lg font-medium mb-2">No evidence collected yet</p>
            <p className="text-gray-400 text-sm text-center max-w-md">Evidence will be gathered from conversations</p>
          </div>
        )}
      </div>

      {/* Interests from Evidence */}
      {interestEvidence.length > 0 && (
        <div className="bg-white rounded-2xl p-8 shadow-sm" style={{ boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)" }}>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Interests</h3>
          <div className="flex flex-wrap gap-3">
            {interestEvidence.slice(0, 8).map((e, index) => (
              <span
                key={e.id || index}
                className="px-4 py-2 bg-gray-50 text-gray-700 rounded-full text-sm font-medium border border-gray-200"
              >
                {e.claim}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Identity Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(identity.known)
          .slice(0, 4)
          .map(([key, value]) => (
            <div
              key={key}
              className="bg-white rounded-xl p-6 shadow-sm"
              style={{ boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)" }}
            >
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {key.replace(/_/g, " ")}
              </h4>
              <p className="text-lg font-medium text-gray-900">{String(value)}</p>
            </div>
          ))}
        {Object.entries(identity.inferred)
          .slice(0, 4)
          .map(([key, value]) => (
            <div
              key={key}
              className="bg-white rounded-xl p-6 shadow-sm"
              style={{ boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)" }}
            >
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {key.replace(/_/g, " ")} (inferred)
              </h4>
              <p className="text-lg font-medium text-gray-900">{String(value)}</p>
            </div>
          ))}
      </div>
    </div>
  );
}
