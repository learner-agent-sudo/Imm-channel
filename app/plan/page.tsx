import type { Metadata } from "next";
import Planner from "@/components/planner";
import { getDraws } from "@/lib/draws";

export const metadata: Metadata = {
  title: "Plan my pathway — Imm Channel",
};

export default async function PlanPage() {
  const draws = await getDraws();
  return <Planner draws={draws} />;
}
