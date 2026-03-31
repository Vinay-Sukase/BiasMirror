import type { AssessmentItem, AssessmentSection } from "@biasmirror/shared";
import { ArrowLeft, ArrowRight, Info, LoaderCircle, LockKeyhole, PlayCircle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tooltip } from "@/components/ui/tooltip";
import { useAuth } from "@/context/AuthContext";
import { useAssessmentDraft } from "@/hooks/useAssessmentDraft";
import {
  createAssessmentSession,
  fetchAssessmentDefinition,
  fetchAssessmentSession,
  submitAssessment,
  trackUserEvent
} from "@/lib/api";

const agreementOptions = [
  { value: 1, label: "Strongly disagree", hint: "Not true of me" },
  { value: 2, label: "Disagree", hint: "Mostly not true" },
  { value: 3, label: "Neutral", hint: "Mixed or unsure" },
  { value: 4, label: "Agree", hint: "Mostly true" },
  { value: 5, label: "Strongly agree", hint: "Very true of me" }
];

type QuestionOption = {
  value: number;
  label: string;
  hint?: string;
};

function sectionAnsweredCount(section: AssessmentSection, answers: Record<string, number>) {
  return section.items.filter((item) => answers[item.id] !== undefined).length;
}

function getOptionSet(question: AssessmentItem): QuestionOption[] {
  if (question.section === "scenarios") {
    return (question.options ?? []).map((option) => ({
      value: option.value,
      label: option.label
    }));
  }

  return agreementOptions;
}

export function AssessmentPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { draft, setDraft, clearDraft } = useAssessmentDraft();
  const [definition, setDefinition] = useState<any>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [questionIndexes, setQuestionIndexes] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const questionStartRef = useRef<number>(Date.now());

  async function ensureSessionId(existingSessionId?: string | null) {
    if (existingSessionId) {
      try {
        await fetchAssessmentSession(existingSessionId);
        return existingSessionId;
      } catch {
        // Fall through to create a new valid session when local state is stale.
      }
    }

    const session = await createAssessmentSession();
    setDraft((current) => ({ ...current, sessionId: session.sessionId }));
    return session.sessionId;
  }

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }

    async function load() {
      setLoading(true);
      try {
        const [assessment] = await Promise.all([
          fetchAssessmentDefinition(),
          ensureSessionId(draft.sessionId)
        ]);
        setDefinition(assessment);
        setQuestionIndexes(
          Object.fromEntries(assessment.sections.map((section: AssessmentSection) => [section.id, 0]))
        );
      } catch {
        setError("We couldn't load the assessment right now.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [draft.sessionId, isAuthenticated, navigate, setDraft]);

  const sections: AssessmentSection[] = useMemo(() => definition?.sections ?? [], [definition]);
  const totalQuestions = useMemo(
    () => sections.reduce((count, section) => count + section.items.length, 0),
    [sections]
  );
  const answeredCount = Object.keys(draft.answers).length;
  const progress = totalQuestions ? (answeredCount / totalQuestions) * 100 : 0;

  const activeSection = sections.find((section) => section.id === activeSectionId) ?? null;
  const activeQuestion = activeSection
    ? activeSection.items[questionIndexes[activeSection.id] ?? 0]
    : null;

  useEffect(() => {
    questionStartRef.current = Date.now();
  }, [activeSectionId, activeQuestion?.id]);

  if (!isAuthenticated) return null;

  function isSectionComplete(section: AssessmentSection) {
    return sectionAnsweredCount(section, draft.answers) === section.items.length;
  }

  function isSectionUnlocked(sectionIndex: number) {
    return sections.slice(0, sectionIndex).every((section) => isSectionComplete(section));
  }

  function openSection(section: AssessmentSection) {
    const firstUnanswered = section.items.findIndex((item) => draft.answers[item.id] === undefined);
    setQuestionIndexes((current) => ({
      ...current,
      [section.id]: firstUnanswered === -1 ? 0 : firstUnanswered
    }));
    setActiveSectionId(section.id);
    setError("");
  }

  async function handleSelectAnswer(value: number) {
    if (!activeQuestion) return;
    const responseTime = Date.now() - questionStartRef.current;
    const timestamp = new Date().toISOString();
    const nextAnswers = { ...draft.answers, [activeQuestion.id]: value };
    const nextTimes = { ...draft.responseTimes, [activeQuestion.id]: responseTime };

    setDraft((current) => ({
      ...current,
      answers: nextAnswers,
      responseTimes: nextTimes
    }));

    if (draft.sessionId) {
      void trackUserEvent({
        sessionId: draft.sessionId,
        questionId: activeQuestion.id,
        answer: value,
        responseTime,
        timestamp
      });
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    try {
      let sessionId = draft.sessionId ?? (await ensureSessionId(null));
      let result;

      try {
        result = await submitAssessment(sessionId, {
          answers: draft.answers,
          responseTimes: draft.responseTimes
        });
      } catch (submissionError) {
        if (!(submissionError instanceof Error) || submissionError.message !== "Session not found") {
          throw submissionError;
        }

        sessionId = await ensureSessionId(null);
        result = await submitAssessment(sessionId, {
          answers: draft.answers,
          responseTimes: draft.responseTimes
        });
      }

      clearDraft();
      window.localStorage.setItem("biasmirror-latest-result", JSON.stringify(result));
      navigate("/dashboard");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "We couldn't submit your assessment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const allSectionsComplete = sections.length > 0 && sections.every((section) => isSectionComplete(section));

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-haze">Guided assessment</p>
            <h2 className="mt-2 text-3xl font-semibold">Complete the assessment section by section</h2>
            <p className="mt-3 max-w-3xl text-haze">
              Start with self-perception, move into realistic scenarios, and finish with personality markers. This order reduces priming and keeps the signal more balanced.
            </p>
          </div>
          <Tooltip content="Response times are captured and used as behavioral context alongside your answers.">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/8 px-4 py-2 text-sm text-haze">
              <Info className="h-4 w-4" />
              Timing-aware scoring
            </div>
          </Tooltip>
        </div>
        <div className="mt-8 space-y-3">
          <div className="flex items-center justify-between text-sm text-haze">
            <span>{answeredCount} of {totalQuestions} answered</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} />
        </div>
      </Card>

      {loading ? (
        <Card className="flex items-center gap-3 text-haze">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          Loading your assessment...
        </Card>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            {sections.map((section, index) => {
              const answered = sectionAnsweredCount(section, draft.answers);
              const unlocked = isSectionUnlocked(index);
              const complete = answered === section.items.length;
              const active = activeSectionId === section.id;

              return (
                <Card
                  key={section.id}
                  className={`flex h-full flex-col justify-between ${active ? "border-iris/50 bg-iris/10" : ""}`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <Badge>{section.title}</Badge>
                      {!unlocked ? <LockKeyhole className="h-4 w-4 text-haze" /> : null}
                    </div>
                    <p className="mt-4 text-lg font-semibold">{section.title}</p>
                    <p className="mt-3 min-h-24 leading-7 text-haze">{section.description}</p>
                  </div>
                  <div className="mt-6">
                    <div className="mb-4 flex items-center justify-between text-sm text-haze">
                      <span>{answered}/{section.items.length} answered</span>
                      <span>{complete ? "Complete" : unlocked ? "Ready" : "Locked"}</span>
                    </div>
                    <Button
                      className="w-full"
                      variant={active ? "primary" : "secondary"}
                      disabled={!unlocked}
                      onClick={() => openSection(section)}
                    >
                      {!unlocked ? "Finish previous section first" : complete ? "Review section" : active ? "Continue section" : "Start section"}
                      {unlocked ? <PlayCircle className="ml-2 h-4 w-4" /> : null}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </section>

          {activeSection && activeQuestion ? (
            <Card className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="rounded-[24px] border border-white/10 bg-white/6 px-4 py-3 text-sm font-semibold text-haze">
                  Q{(questionIndexes[activeSection.id] ?? 0) + 1}
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.28em] text-haze">{activeSection.title}</p>
                  <h3 className="mt-3 max-w-4xl text-3xl font-semibold leading-tight">{activeQuestion.prompt}</h3>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                {getOptionSet(activeQuestion).map((option) => {
                  const active = draft.answers[activeQuestion.id] === option.value;
                  return (
                    <button
                      key={option.value}
                      className={`rounded-[28px] border px-5 py-6 text-center transition ${active ? "border-iris bg-iris/20 text-white shadow-glow" : "border-white/10 bg-white/6 text-ink hover:border-white/20 hover:bg-white/10"}`}
                      onClick={() => handleSelectAnswer(option.value)}
                      type="button"
                    >
                      <span className="block text-base font-semibold">{option.label}</span>
                      {option.hint ? (
                        <span className="mt-2 block text-sm text-haze">{option.hint}</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <Button
                  variant="ghost"
                  onClick={() => {
                    const currentIndex = questionIndexes[activeSection.id] ?? 0;
                    if (currentIndex === 0) {
                      setActiveSectionId(null);
                      return;
                    }
                    setQuestionIndexes((current) => ({
                      ...current,
                      [activeSection.id]: Math.max(0, currentIndex - 1)
                    }));
                  }}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>

                <div className="flex flex-col items-end gap-3">
                  <p className="text-sm text-haze">
                    {draft.answers[activeQuestion.id] === undefined
                      ? "Choose one option to continue."
                      : "Answer saved for analysis."}
                  </p>
                  <Button
                    disabled={draft.answers[activeQuestion.id] === undefined}
                    onClick={() => {
                      const currentIndex = questionIndexes[activeSection.id] ?? 0;
                      const isLastQuestion = currentIndex === activeSection.items.length - 1;
                      if (isLastQuestion) {
                        setActiveSectionId(null);
                        return;
                      }
                      setQuestionIndexes((current) => ({
                        ...current,
                        [activeSection.id]: currentIndex + 1
                      }));
                    }}
                  >
                    {(questionIndexes[activeSection.id] ?? 0) === activeSection.items.length - 1 ? "Finish section" : "Next question"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card>
              <h3 className="text-2xl font-semibold">
                {allSectionsComplete ? "Everything is ready to submit" : "Choose a section to begin"}
              </h3>
              <p className="mt-3 max-w-3xl text-haze">
                {allSectionsComplete
                  ? "You can review any section again, or submit now to generate your dashboard and insights."
                  : "Each section has a specific purpose. Start the next unlocked section to keep your assessment moving in the intended order."}
              </p>
              <div className="mt-6">
                <Button onClick={handleSubmit} disabled={!allSectionsComplete || submitting}>
                  {submitting ? "Submitting..." : "Finish assessment"}
                </Button>
              </div>
            </Card>
          )}

          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        </>
      )}
    </div>
  );
}
