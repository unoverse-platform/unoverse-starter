import React from "react";
import { motion } from "framer-motion";
import { Network, Brain } from "lucide-react";

export default function NetworkView({ evidence, composed }) {
  // v2 only - show evidence relationships
  const hasEvidence = evidence?.length > 0;

  // Group evidence by domain
  const domains = {};
  evidence?.forEach((e) => {
    if (!domains[e.domain]) domains[e.domain] = [];
    domains[e.domain].push(e);
  });

  if (!hasEvidence) {
    return (
      <div
        className="bg-white rounded-2xl p-8 shadow-sm text-center"
        style={{ boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)" }}
      >
        <Network className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p className="text-gray-500">No evidence network yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm" style={{ boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)" }}>
      <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
        <Network className="w-5 h-5" />
        Evidence Network
      </h3>

      <div className="space-y-6">
        {Object.entries(domains).map(([domain, items], i) => (
          <motion.div
            key={domain}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-4 bg-gray-50 rounded-xl"
          >
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Brain className="w-4 h-4" />
              {domain}
              <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full">{items.length}</span>
            </h4>
            <div className="space-y-2">
              {items.slice(0, 5).map((e, j) => (
                <div key={e.id || j} className="flex items-center gap-2 text-sm">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      e.type === "explicit"
                        ? "bg-blue-500"
                        : e.type === "deductive"
                          ? "bg-green-500"
                          : e.type === "inductive"
                            ? "bg-purple-500"
                            : "bg-orange-500"
                    }`}
                  />
                  <span className="text-gray-700 truncate">{e.claim}</span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
