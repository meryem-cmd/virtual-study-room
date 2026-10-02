// Initials in a soft coloured circle. The colour is picked from the name,
// so the same person always gets the same colour everywhere.

function initialsOf(name: string) {
  // "BCSF23M007-Maryyam Tanveer" -> uses the last two words: "MT"
  const words = name
    .replace(/[-_]/g, " ")
    .split(" ")
    .filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  const first = words[words.length - 2][0];
  const last = words[words.length - 1][0];
  return (first + last).toUpperCase();
}

function toneOf(name: string) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return hash % 2 === 0
    ? "bg-lamp/15 text-ink"
    : "bg-sage/20 text-ink";
}

export function Avatar({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "h-7 w-7 text-[11px]",
    md: "h-8 w-8 text-xs",
    lg: "h-14 w-14 text-base",
  };
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-medium ${sizes[size]} ${toneOf(
        name
      )}`}
      aria-hidden="true"
    >
      {initialsOf(name)}
    </span>
  );
}