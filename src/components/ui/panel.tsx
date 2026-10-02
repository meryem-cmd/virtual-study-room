export function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`border border-rule rounded-lg p-6 bg-white/60 ${className}`}>
      {children}
    </div>
  );
}