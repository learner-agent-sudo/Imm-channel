"use client";

import { useMemo, useState } from "react";
import type { DrawsData, Profile } from "@/lib/types";
import { buildPlannerResult } from "@/lib/roadmap";
import Wizard from "@/components/wizard";
import Results from "@/components/results";

/**
 * Client-side orchestrator: the profile and every computation stay in the
 * browser. The only server-provided input is public draw data.
 */
export default function Planner({ draws }: { draws: DrawsData }) {
  const [profile, setProfile] = useState<Profile | null>(null);

  const result = useMemo(
    () => (profile ? buildPlannerResult(profile, draws) : null),
    [profile, draws],
  );

  if (result) {
    return <Results result={result} draws={draws} onRestart={() => setProfile(null)} />;
  }
  return <Wizard onComplete={setProfile} />;
}
