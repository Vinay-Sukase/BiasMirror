import { useEffect, useState } from "react";

const STORAGE_KEY = "biasmirror-assessment-draft";

interface DraftState {
  sessionId: string | null;
  answers: Record<string, number>;
  responseTimes: Record<string, number>;
}

const initialDraft: DraftState = {
  sessionId: null,
  answers: {},
  responseTimes: {}
};

export function useAssessmentDraft() {
  const [draft, setDraft] = useState<DraftState>(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialDraft;
    try {
      return JSON.parse(raw) as DraftState;
    } catch {
      return initialDraft;
    }
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [draft]);

  return {
    draft,
    setDraft,
    clearDraft() {
      setDraft(initialDraft);
      window.localStorage.removeItem(STORAGE_KEY);
    }
  };
}
