import type { Metadata } from "next";
import GuideView from "@/components/guide-view";
import { studyPermitGuide } from "@/lib/guides/study-permit";

export const metadata: Metadata = {
  title: "Study permit, step by step — Imm Channel",
  description:
    "How to choose a PGWP-safe program, get the PAL and LOA, prove funds, and avoid the common refusal reasons — with timelines per intake.",
};

export default function StudyPermitGuidePage() {
  return <GuideView content={studyPermitGuide} />;
}
