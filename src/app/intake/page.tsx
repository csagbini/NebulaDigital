import type { Metadata } from "next";
import IntakeForm from "./IntakeForm";

export const metadata: Metadata = {
  title: "Client intake — Nebula Digital",
  description:
    "Tell us about your business so we can scope your project. Takes about 5 minutes.",
  robots: { index: false, follow: false },
};

export default function IntakePage() {
  return <IntakeForm />;
}
