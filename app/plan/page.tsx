import type { Metadata } from "next";
import Planner from "@/components/planner";
import { getDraws } from "@/lib/draws";

export const metadata: Metadata = {
  title: "Plan my pathway — Imm Channel",
};

export default function PlanPage() {
  return <Planner draws={getDraws()} />;
}
