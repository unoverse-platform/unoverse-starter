import { useState, useEffect, useCallback } from "react";

/**
 * Evidence types (v2 - Honcho-inspired)
 */
export interface Evidence {
  id: string;
  userId: string;
  workflowId: string;
  type: "explicit" | "deductive" | "inductive" | "abductive";
  domain: string;
  claim: string;
  premises: Array<{
    observation: string;
    conversationId?: string;
    timestamp?: string;
    confidence?: number;
    sourceEvidenceId?: string;
  }>;
  certainty: number;
  firstObserved: string;
  lastReinforced: string;
  reinforcementCount: number;
  supports?: string[];
  contradicts?: string[];
  sourceConversationIds: string[];
}

export interface ComposedMemory {
  summary: string;
  identity: {
    known: Record<string, any>;
    inferred: Record<string, any>;
  };
  currentNeeds: Array<{
    need: string;
    certainty: number;
    evidence: string[];
    domain?: string;
  }>;
  interests: Array<{
    interest: string;
    certainty: number;
    reinforcementCount: number;
  }>;
  hypotheses: Array<{
    hypothesis: string;
    certainty: number;
    evidence: string[];
  }>;
  facts: Array<{
    fact: string;
    domain: string;
    reinforcementCount: number;
  }>;
  evidenceCount: number;
}

export interface EvidenceResponse {
  evidence: Evidence[];
  grouped: {
    explicit: Evidence[];
    deductive: Evidence[];
    inductive: Evidence[];
    abductive: Evidence[];
  };
  composed: ComposedMemory;
  metadata: {
    total: number;
    byType: {
      explicit: number;
      deductive: number;
      inductive: number;
      abductive: number;
    };
  };
}

export interface UseProfileDataOptions {
  apiUrl: string;
  getAccessToken?: () => Promise<string | null>;
}

export interface UseProfileDataReturn {
  evidence: Evidence[];
  composed: ComposedMemory | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Fetch evidence for a user from the API
 */
async function fetchEvidence(
  userId: string,
  workflowId: string,
  apiUrl: string,
  getAccessToken?: () => Promise<string | null>,
): Promise<EvidenceResponse | null> {
  try {
    const token = getAccessToken ? await getAccessToken() : null;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const url = `${apiUrl}/api/evidence/${userId}/${workflowId}?limit=100`;
    const response = await fetch(url, { headers });

    if (!response.ok) {
      console.warn(`[fetchEvidence] Failed with status ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.warn("[fetchEvidence] Error:", error);
    return null;
  }
}

/**
 * Hook to fetch user memory data via v2 Evidence API
 */
export function useProfileData(
  userId: string,
  workflowId: string,
  options: UseProfileDataOptions,
): UseProfileDataReturn {
  const { apiUrl, getAccessToken } = options;

  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [composed, setComposed] = useState<ComposedMemory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!userId || !workflowId) return;

    setLoading(true);
    setError(null);

    try {
      const evidenceData = await fetchEvidence(userId, workflowId, apiUrl, getAccessToken);

      if (evidenceData) {
        setEvidence(evidenceData.evidence || []);
        setComposed(evidenceData.composed || null);
      }
    } catch (err: any) {
      console.error("[useProfileData] Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId, workflowId, apiUrl, getAccessToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    evidence,
    composed,
    loading,
    error,
    refetch: fetchData,
  };
}

export default useProfileData;
