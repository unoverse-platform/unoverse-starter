// Engagement score calculation (v2 - evidence-based)
export function calculateEngagementReadiness(profileData, evidence = []) {
  let score = 20; // Base score for any interaction

  // Profile completeness (generic fields)
  const profileFields = [
    profileData?.profile?.name,
    profileData?.profile?.email,
    profileData?.profile?.phone,
    profileData?.profile?.firstName,
  ];
  const filledProfileFields = profileFields.filter((field) => field && field.trim() !== "").length;
  score += (filledProfileFields / profileFields.length) * 20; // Up to 20% for basic profile

  // Service interests engagement
  if (profileData?.serviceInterests) {
    const interestValues = Object.values(profileData.serviceInterests);
    const activeInterests = interestValues.filter((v) => v > 0).length;
    const avgInterestLevel =
      interestValues.length > 0 ? interestValues.reduce((a, b) => a + b, 0) / interestValues.length : 0;

    // Up to 15% based on number of interests selected
    score += Math.min((activeInterests / Math.max(interestValues.length, 1)) * 15, 15);
    // Up to 10% based on average interest level (0-10 scale)
    score += (avgInterestLevel / 10) * 10;
  }

  // Evidence depth and quality (v2)
  if (evidence && evidence.length > 0) {
    // Up to 15% for evidence count (capped at 20 pieces)
    score += Math.min((evidence.length / 20) * 15, 15);

    // Bonus for high-certainty evidence
    const explicitCount = evidence.filter((e) => e.type === "explicit").length;
    const deductiveCount = evidence.filter((e) => e.type === "deductive").length;
    const inductiveCount = evidence.filter((e) => e.type === "inductive").length;

    // Up to 10% for explicit facts (capped at 10)
    score += Math.min((explicitCount / 10) * 10, 10);

    // Up to 5% for patterns (inductive evidence)
    if (inductiveCount > 0) score += 5;

    // Recent activity bonus based on lastReinforced
    const recentEvidence = evidence.filter(
      (e) => new Date(e.lastReinforced) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    );
    const veryRecentEvidence = evidence.filter(
      (e) => new Date(e.lastReinforced) > new Date(Date.now() - 24 * 60 * 60 * 1000),
    );

    if (veryRecentEvidence.length > 0)
      score += 10; // Active in last 24h
    else if (recentEvidence.length > 0) score += 5; // Active in last week
  }

  return Math.min(Math.round(score), 100);
}

// Calculate regulatory interest based on evidence
export function calculateRegulatoryInterest(evidence = []) {
  const regulatoryKeywords = ["regulatory", "compliance", "license", "permit", "approval"];
  const relevantEvidence = evidence.filter((e) =>
    regulatoryKeywords.some((keyword) => e.claim.toLowerCase().includes(keyword)),
  );
  return Math.min(relevantEvidence.length * 20, 100);
}

// Calculate timeline urgency based on recent evidence activity
export function calculateTimelineUrgency(evidence = []) {
  const recentEvidence = evidence.filter(
    (e) => new Date(e.lastReinforced) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  );
  return recentEvidence.length > 5 ? "High" : recentEvidence.length > 2 ? "Medium" : "Low";
}

// Get engagement stage based on score
export function getEngagementStage(score) {
  if (score >= 80) return "Active";
  if (score >= 60) return "Engaged";
  if (score >= 40) return "Exploring";
  return "Initial";
}

// Get user segment based on score
export function getSegment(score) {
  if (score >= 85) return "High Value";
  if (score >= 65) return "Qualified";
  if (score >= 40) return "Prospect";
  return "New Lead";
}

// Generate recommended steps based on profile and evidence
export function generateRecommendedSteps(profileData, evidence = []) {
  const steps = [];

  // Check profile completeness
  if (!profileData?.profile?.email || !profileData?.profile?.phone) {
    steps.push({
      title: "Complete Your Profile",
      description: "Add missing contact information to help us serve you better",
      priority: "high",
    });
  }

  // Check service interests
  if (!profileData?.serviceInterests || Object.values(profileData.serviceInterests).every((v) => v === 0)) {
    steps.push({
      title: "Select Your Interests",
      description: "Tell us what services you're interested in",
      priority: "medium",
    });
  }

  // Check recent activity based on evidence
  const recentEvidence = evidence.filter(
    (e) => new Date(e.lastReinforced) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  );
  if (recentEvidence.length === 0 && evidence.length > 0) {
    steps.push({
      title: "Stay Engaged",
      description: "Continue your conversation to get personalized recommendations",
      priority: "low",
    });
  }

  return steps;
}
