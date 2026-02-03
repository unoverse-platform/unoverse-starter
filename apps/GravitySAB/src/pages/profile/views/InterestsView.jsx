import React from "react";
import { InterestBubbles } from "../components/InterestBubbles";
import { motion } from "framer-motion";

export default function InterestsView({ evidence, composed }) {
  // v2 only - extract interests and needs from composed understanding
  const interests = composed?.interests || [];
  const currentNeeds = composed?.currentNeeds || [];

  // Show elegant empty state if no data
  if (interests.length === 0 && currentNeeds.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-5xl font-thin text-black mb-6">No insights yet</h1>
          <p className="text-xl text-gray-600 font-light">Your journey begins with the first conversation.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Interests from v2 composed */}
      {interests.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-100"
          style={{ boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)" }}
        >
          <h2 className="text-3xl font-light text-gray-900 mb-8">Areas of Interest</h2>
          <InterestBubbles
            interests={interests.map((i) => ({
              name: i.interest,
              weight: i.certainty || 0.7,
              reinforcementCount: i.reinforcementCount,
            }))}
          />
        </motion.div>
      )}

      {/* Current Needs from v2 composed */}
      {currentNeeds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-100"
          style={{ boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)" }}
        >
          <h2 className="text-3xl font-light text-gray-900 mb-8">Current Needs</h2>

          <div className="space-y-4">
            {currentNeeds.map((need, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-lg border ${
                  need.certainty >= 0.8
                    ? "bg-red-50 border-red-200"
                    : need.certainty >= 0.5
                      ? "bg-blue-50 border-blue-200"
                      : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        need.certainty >= 0.8 ? "bg-red-500" : need.certainty >= 0.5 ? "bg-blue-500" : "bg-gray-500"
                      }`}
                    ></div>
                    <span className="text-sm font-medium text-gray-500">
                      {need.certainty >= 0.8
                        ? "High Priority"
                        : need.certainty >= 0.5
                          ? "Medium Priority"
                          : "Low Priority"}
                    </span>
                  </div>
                  <span className="text-sm px-2 py-0.5 bg-white rounded-full border">
                    {Math.round(need.certainty * 100)}% certainty
                  </span>
                </div>
                <p className="text-gray-700">{need.need}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
