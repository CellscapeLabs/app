// Renders the Cellscape favicon SVG as a 32×32 logo mark for nav and footer use.
export function CellscapeIcon({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/favicon.svg"
      alt="Cellscape"
      width={32}
      height={32}
      className={`rounded-lg shadow-md shadow-emerald-200 ${className ?? ""}`.trim()}
    />
  );
}
