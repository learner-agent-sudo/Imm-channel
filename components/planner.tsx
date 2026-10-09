"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  const [resetKey, setResetKey] = useState(0);
  const container = useRef<HTMLDivElement>(null);

  // Shared computers: if the visitor leaves the site in this tab, pressing
  // Back must not bring their answers or plan back from the browser's
  // back/forward cache. The page is blanked as it's cached, and the planner
  // starts over when it's restored.
  useEffect(() => {
    const onPageHide = (e: PageTransitionEvent) => {
      if (e.persisted && container.current) container.current.style.visibility = "hidden";
    };
    const onPageShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      setProfile(null);
      setResetKey((k) => k + 1); // remounts the wizard with empty answers
      if (container.current) container.current.style.visibility = "";
    };
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  const result = useMemo(
    () => (profile ? buildPlannerResult(profile, draws) : null),
    [profile, draws],
  );

  return (
    <div ref={container} className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">{t("plan.title")}</h1>
      <p className="mt-2 text-soft">{t("plan.sub")}</p>
      <div className="mt-8">
        {result ? (
          <Results result={result} draws={draws} onRestart={() => setProfile(null)} />
        ) : (
          <Wizard key={resetKey} onComplete={setProfile} />
        )}
      </div>
    </div>
  );
}
