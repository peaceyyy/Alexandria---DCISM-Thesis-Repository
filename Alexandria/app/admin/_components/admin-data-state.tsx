type AdminDataStateProps = {
  title: string;
  message: string;
};

export function AdminDataState({ title, message }: AdminDataStateProps) {
  return (
    <section
      className="rounded-[10px] border border-[var(--color-separator)] bg-[var(--color-surface)] p-6"
      role="alert"
    >
      <h2 className="text-base font-bold text-[var(--color-text)]">{title}</h2>
      <p className="mt-2 text-sm text-[var(--color-text-muted)]">{message}</p>
    </section>
  );
}
