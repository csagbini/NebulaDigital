"use client";

/** Hidden when printing — see the @media print block in admin.css. */
export default function PrintBar({ backHref }: { backHref: string }) {
  return (
    <div className="pr-bar">
      <button onClick={() => window.print()} type="button">
        Print / Save as PDF
      </button>
      <a href={backHref}>Back to intakes</a>
    </div>
  );
}
