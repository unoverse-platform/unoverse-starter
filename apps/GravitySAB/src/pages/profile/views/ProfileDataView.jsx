import React from "react";
import { motion } from "framer-motion";
import { Mail, User, MapPin, Brain, Lightbulb, CheckCircle, HelpCircle } from "lucide-react";

export function ProfileDataView({ evidence = [], composed = null }) {
  // v2 only - all data from evidence and composed understanding

  // Check if we have any data
  if (!evidence?.length && !composed) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <Brain className="w-16 h-16 text-gray-300 mb-4" />
        <p className="text-lg">No evidence collected yet</p>
        <p className="text-sm mt-2">Evidence will be gathered from conversations</p>
      </div>
    );
  }

  // Extract identity from composed
  const identity = composed?.identity || { known: {}, inferred: {} };
  const { known, inferred } = identity;
  const hasIdentity = Object.keys(known).length > 0 || Object.keys(inferred).length > 0;

  return (
    <div className="space-y-6">
      {/* Identity from Composed Understanding */}
      {hasIdentity && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-gray-200/50"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Identity</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Known facts */}
            {Object.entries(known).map(([key, value]) => (
              <div key={key} className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 capitalize">{key.replace(/_/g, " ")}</p>
                  <p className="font-medium text-gray-900">{String(value)}</p>
                </div>
              </div>
            ))}
            {/* Inferred facts */}
            {Object.entries(inferred).map(([key, value]) => (
              <div key={key} className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Lightbulb className="w-4 h-4 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 capitalize">{key.replace(/_/g, " ")} (inferred)</p>
                  <p className="font-medium text-gray-900">{String(value)}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Summary from Composed */}
      {composed?.summary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 shadow-lg border border-purple-100"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            Understanding Summary
          </h3>
          <p className="text-gray-700 leading-relaxed">{composed.summary}</p>
        </motion.div>
      )}

      {/* Evidence by Type */}
      {evidence.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-gray-200/50"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            Evidence
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full ml-2">
              {evidence.length} pieces
            </span>
          </h3>

          <div className="space-y-4">
            {/* Explicit Evidence */}
            {evidence.filter((e) => e.type === "explicit").length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                  <p className="text-sm font-medium text-gray-700">Explicit Facts (100% certain)</p>
                </div>
                <div className="space-y-2">
                  {evidence
                    .filter((e) => e.type === "explicit")
                    .slice(0, 5)
                    .map((e, i) => (
                      <div key={e.id || i} className="flex items-start gap-2 p-2 bg-blue-50 rounded-lg">
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{e.domain}</span>
                        <span className="text-sm text-gray-700 flex-1">{e.claim}</span>
                        {e.reinforcementCount > 1 && (
                          <span className="text-xs text-blue-600">×{e.reinforcementCount}</span>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Deductive Evidence */}
            {evidence.filter((e) => e.type === "deductive").length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-green-500" />
                  <p className="text-sm font-medium text-gray-700">Deductive Conclusions (100% certain)</p>
                </div>
                <div className="space-y-2">
                  {evidence
                    .filter((e) => e.type === "deductive")
                    .slice(0, 5)
                    .map((e, i) => (
                      <div key={e.id || i} className="flex items-start gap-2 p-2 bg-green-50 rounded-lg">
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">{e.domain}</span>
                        <span className="text-sm text-gray-700 flex-1">{e.claim}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Inductive Evidence */}
            {evidence.filter((e) => e.type === "inductive").length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-4 h-4 text-purple-500" />
                  <p className="text-sm font-medium text-gray-700">Patterns (60-90% certain)</p>
                </div>
                <div className="space-y-2">
                  {evidence
                    .filter((e) => e.type === "inductive")
                    .slice(0, 3)
                    .map((e, i) => (
                      <div key={e.id || i} className="flex items-start gap-2 p-2 bg-purple-50 rounded-lg">
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                          {Math.round((e.certainty || 0.7) * 100)}%
                        </span>
                        <span className="text-sm text-gray-700 flex-1">{e.claim}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Abductive Evidence (Hypotheses) */}
            {evidence.filter((e) => e.type === "abductive").length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <HelpCircle className="w-4 h-4 text-orange-500" />
                  <p className="text-sm font-medium text-gray-700">Hypotheses (30-70% certain)</p>
                </div>
                <div className="space-y-2">
                  {evidence
                    .filter((e) => e.type === "abductive")
                    .slice(0, 3)
                    .map((e, i) => (
                      <div key={e.id || i} className="flex items-start gap-2 p-2 bg-orange-50 rounded-lg">
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                          {Math.round((e.certainty || 0.5) * 100)}%
                        </span>
                        <span className="text-sm text-gray-700 flex-1">{e.claim}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Evidence stats */}
          <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap items-center gap-4 text-xs text-gray-500">
            <span>Explicit: {evidence.filter((e) => e.type === "explicit").length}</span>
            <span>Deductive: {evidence.filter((e) => e.type === "deductive").length}</span>
            <span>Inductive: {evidence.filter((e) => e.type === "inductive").length}</span>
            <span>Abductive: {evidence.filter((e) => e.type === "abductive").length}</span>
          </div>
        </motion.div>
      )}

      {/* Hypotheses from Composed */}
      {composed?.hypotheses?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-gray-200/50"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-orange-500" />
            Hypotheses
          </h3>
          <div className="space-y-3">
            {composed.hypotheses.map((h, i) => (
              <div key={i} className="p-3 bg-orange-50 rounded-lg border border-orange-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{h.hypothesis}</span>
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
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

export default ProfileDataView;
