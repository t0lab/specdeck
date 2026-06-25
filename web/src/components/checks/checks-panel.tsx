import { CheckBadge } from "@/components/status/check-badge";
import { EvidenceChip } from "@/components/status/evidence-chip";
import { checkProgress } from "@/lib/check-progress";
import type { Check, CheckKind } from "@/mock/types";

// Checks + Evidence tab. Checks are grouped in verify order (deterministic →
// evidence → held-out → judge). The hard invariant (Principle I, SC-004): a
// `pass` with no Evidence is NEVER shown green — it renders as not-passed with
// a "No evidence" warning, and checkProgress already excludes it from the count.

const KIND_ORDER: { kind: CheckKind; label: string }[] = [
  { kind: "deterministic", label: "Deterministic" },
  { kind: "evidence", label: "Evidence" },
  { kind: "held-out", label: "Held-out" },
  { kind: "judge", label: "Judge" },
];

function isMissingEvidence(c: Check): boolean {
  return c.state === "pass" && c.evidence == null;
}

function CheckRow({ check }: { check: Check }) {
  const missing = isMissingEvidence(check);
  return (
    <li className="flex items-start justify-between gap-3 py-2">
      <div className="flex min-w-0 items-center gap-2">
        {/* never green when evidence is missing — downgrade the glyph */}
        <CheckBadge state={missing ? "pending" : check.state} showLabel={false} />
        <span className="min-w-0 text-sm text-foreground/90">{check.label}</span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {check.refs?.length ? (
          <span className="font-mono text-[0.7rem] text-mute tabular-nums">
            {check.refs.join(" ")}
          </span>
        ) : null}
        {missing ? (
          <EvidenceChip missing />
        ) : check.evidence ? (
          <EvidenceChip href={check.evidence.href} label={check.evidence.type} />
        ) : null}
      </div>
    </li>
  );
}

export function ChecksPanel({ checks }: { checks: Check[] }) {
  if (checks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-mute">
        No Checks yet — this Spec hasn&rsquo;t been verified.
      </div>
    );
  }

  const { passed, total } = checkProgress(checks);
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Checks passed</span>
          <span className="font-mono text-mute tabular-nums">
            {passed}/{total}
          </span>
        </div>
        <div
          className="h-1.5 overflow-hidden rounded-full bg-surface-2"
          role="progressbar"
          aria-valuenow={passed}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-label={`${passed} of ${total} checks passed`}
        >
          <div
            className="h-full rounded-full bg-check-pass"
            style={{ width: `${total ? (passed / total) * 100 : 0}%` }}
          />
        </div>
      </div>

      {KIND_ORDER.map(({ kind, label }) => {
        const group = checks.filter((c) => c.kind === kind);
        if (group.length === 0) return null;
        return (
          <section key={kind} className="flex flex-col gap-1">
            <h4 className="text-xs font-medium uppercase tracking-wide text-mute">
              {label}
            </h4>
            <ul className="divide-y divide-border/60">
              {group.map((c) => (
                <CheckRow key={c.id} check={c} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
