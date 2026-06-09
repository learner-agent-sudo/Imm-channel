import type { Metadata } from "next";
import Planner from "@/components/planner";
import { getDraws } from "@/lib/draws";

export const metadata: Metadata = {
  title: "Plan my pathway — Imm Channel",
};

export default async function PlanPage() {
  const draws = await getDraws();
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Build your roadmap</h1>
      <p className="mt-2 text-soft">
        Five short steps, no personal identifiers. Your answers never leave
        this browser tab.
      </p>
      <div className="mt-8">
        <Planner draws={draws} />
      </div>
    </div>
  );
}
