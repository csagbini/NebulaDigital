import type { Metadata } from "next";
import IntakeForm from "./IntakeForm";

export const metadata: Metadata = {
  title: "Client intake — Nebula Digital",
  description: "Tell us about your business so we can scope your project.",
  robots: { index: false, follow: false },
};

export default function IntakePage() {
  return <IntakeForm />;
}
