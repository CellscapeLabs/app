type LessonLayoutProps = {
  title: string;
  topic: string;
  children: React.ReactNode;
};

export function LessonLayout({ title, topic, children }: LessonLayoutProps) {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-zinc-100 px-6 py-4">
        <p className="text-sm font-medium text-emerald-600">{topic}</p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900">{title}</h1>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-10">{children}</main>
    </div>
  );
}
