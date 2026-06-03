// Inline SVG logo mark — avoids any HTTP request or Next.js static-file interception.
export function CellscapeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 512 512"
      width={32}
      height={32}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      className={`rounded-lg shadow-md shadow-emerald-200 ${className ?? ""}`.trim()}
    >
      <rect x={0} y={0} width={512} height={512} rx={112} fill="#E1F5EE" />
      <ellipse cx={256} cy={256} rx={175} ry={144} fill="none" stroke="#1D9E75" strokeWidth={10.5} />
      <ellipse cx={256} cy={256} rx={175} ry={144} fill="#C0DD97" opacity={0.18} />
      <ellipse cx={256} cy={256} rx={175} ry={144} fill="none" stroke="#0F6E56" strokeWidth={6}
        strokeDasharray="21 12" transform="rotate(28 256 256)" />
      <ellipse cx={256} cy={262} rx={57} ry={48} fill="#1D9E75" opacity={0.9} />
      <ellipse cx={256} cy={262} rx={57} ry={48} fill="none" stroke="#085041" strokeWidth={4.5} />
      <circle cx={166} cy={200} r={15}   fill="#5DCAA5" opacity={0.85} />
      <circle cx={347} cy={208} r={10.5} fill="#5DCAA5" opacity={0.85} />
      <circle cx={176} cy={318} r={9}    fill="#5DCAA5" opacity={0.85} />
      <circle cx={334} cy={310} r={13.5} fill="#5DCAA5" opacity={0.85} />
      <circle cx={256} cy={172} r={9}    fill="#5DCAA5" opacity={0.85} />
    </svg>
  );
}
