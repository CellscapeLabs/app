"use client";
// A one-tap "predict what happens next" check for step-through lessons.
// Controlled: the parent panel keeps answers so they survive moving between stages.
// Never blocks navigation — students can ignore it and keep going.

export interface Prediction {
  question:    string;
  options:     readonly string[];
  correct:     number;
  explanation: string;
}

interface PredictionPromptProps extends Prediction {
  selected:        number | undefined;
  onSelect:        (index: number) => void;
  onContinue?:     () => void;
  continueLabel?:  string;
}

export function PredictionPrompt({
  question, options, correct, explanation, selected, onSelect, onContinue, continueLabel = "See it →",
}: PredictionPromptProps) {
  const answered = selected !== undefined;
  const right = selected === correct;

  return (
    <div className="mt-4 rounded-xl border border-dashed border-zinc-300 bg-white/80 p-4">
      <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
        Predict before you continue
      </div>
      <p className="mb-3 text-sm font-semibold text-zinc-900">{question}</p>

      <div className="grid gap-2" role="group" aria-label={question}>
        {options.map((opt, i) => {
          const isCorrect = i === correct;
          const isPicked = i === selected;
          const tone = !answered
            ? "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50"
            : isCorrect
              ? "border-emerald-400 bg-emerald-50 text-emerald-900"
              : isPicked
                ? "border-rose-300 bg-rose-50 text-rose-900"
                : "border-zinc-100 bg-white text-zinc-400";
          return (
            <button key={opt} onClick={() => !answered && onSelect(i)} aria-pressed={isPicked}
              disabled={answered && !isPicked && !isCorrect}
              className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-left text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 ${tone} ${answered ? "cursor-default" : ""}`}>
              <span aria-hidden="true" className="mt-px w-4 shrink-0 text-center font-black">
                {answered ? (isCorrect ? "✓" : isPicked ? "✗" : "") : String.fromCharCode(65 + i)}
              </span>
              <span>{opt}</span>
            </button>
          );
        })}
      </div>

      <div aria-live="polite">
        {answered && (
          <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
            <p className="flex-1 text-xs leading-relaxed text-zinc-600">
              <span className={`font-bold ${right ? "text-emerald-700" : "text-rose-700"}`}>
                {right ? "Nice — that's right. " : "Not quite. "}
              </span>
              {explanation}
            </p>
            {onContinue && (
              <button onClick={onContinue}
                className="shrink-0 rounded-full bg-zinc-900 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-700">
                {continueLabel}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
