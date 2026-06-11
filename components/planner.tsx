"use client";

import { useMemo, useState } from "react";
import type { DrawsData, Profile } from "@/lib/types";
import { buildPlannerResult } from "@/lib/roadmap";
import Wizard from "@/components/wizard";
import Results from "@/components/results";
import { useT } from "@/components/locale-provider";

/**
 * Client-side orchestrator: the profile and every computation stay in the
 * browser. The only server-provided input is public draw data.
 */
export default function Planner({ draws }: { draws: DrawsData }) {
  const { t } = useT();
  const [profile, setProfile] = useState<Profile | null>(null);

  const result = useMemo(
    () => (profile ? buildPlannerResult(profile, draws) : null),
    [profile, draws],
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">{t("plan.title")}</h1>
      <p className="mt-2 text-soft">{t("plan.sub")}</p>
      <div className="mt-8">
        {result ? (
          <Results result={result} draws={draws} onRestart={() => setProfile(null)} />
        ) : (
          <Wizard onComplete={setProfile} />
        )}
      </div>
    </div>
  );
}
