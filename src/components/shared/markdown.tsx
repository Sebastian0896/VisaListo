import { Fragment } from "react";

/** Renderizador mínimo y seguro (sin HTML) para textos administrables: ## títulos, **negrita**, párrafos y listas "- ". */
export function SimpleMarkdown({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/);
  return (
    <div className="space-y-4 text-[15px] leading-relaxed text-foreground/90">
      {blocks.map((block, i) => {
        const trimmed = block.trim();
        if (trimmed.startsWith("## ")) return <h2 key={i} className="pt-2 text-xl font-semibold text-foreground">{inline(trimmed.slice(3))}</h2>;
        if (trimmed.startsWith("### ")) return <h3 key={i} className="font-semibold text-foreground">{inline(trimmed.slice(4))}</h3>;
        const lines = trimmed.split("\n");
        if (lines.every((l) => l.trim().startsWith("- "))) {
          return (
            <ul key={i} className="list-disc space-y-1 pl-5">
              {lines.map((l, j) => <li key={j}>{inline(l.trim().slice(2))}</li>)}
            </ul>
          );
        }
        return (
          <p key={i}>
            {lines.map((l, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                {inline(l)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function inline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => (p.startsWith("**") && p.endsWith("**") ? <strong key={i} className="font-semibold text-foreground">{p.slice(2, -2)}</strong> : <Fragment key={i}>{p}</Fragment>));
}
