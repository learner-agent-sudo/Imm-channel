import type { Metadata } from "next";
import GuideView from "@/components/guide-view";
import { expressEntryGuide } from "@/lib/guides/express-entry";

export const metadata: Metadata = {
  title: "Express Entry profile, step by step — Imm Channel",
  description:
    "ECA, language tests, creating the profile, what happens after an ITA, and the mistakes that get applications refused after the 60-day clock starts.",
};

export default function ExpressEntryGuidePage() {
  return <GuideView content={expressEntryGuide} />;
}
