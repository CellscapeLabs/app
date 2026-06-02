// Biology concept: placeholder — replace with a real visualization component
// Interactions: none (static label only)

type PlaceholderVizProps = {
  label: string;
};

export function PlaceholderViz({ label }: PlaceholderVizProps) {
  return (
    <div
      role="img"
      aria-label={label}
      className="flex h-64 items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 text-sm text-zinc-400"
    >
      {label}
    </div>
  );
}
