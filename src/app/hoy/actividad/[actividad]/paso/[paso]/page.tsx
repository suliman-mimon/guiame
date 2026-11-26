import { notFound } from "next/navigation";
import type { Id } from "convex/_generated/dataModel";
import StepByStepView from "@/components/estudiante/StepByStepView";

type StepPageProps = {
  params: Promise<{ actividad: string; paso: string }>;
};

export default async function StepPage({ params }: StepPageProps) {
  const { actividad: realizationId, paso } = await params;
  const pasoNumero = Number(paso);

  if (!Number.isInteger(pasoNumero) || pasoNumero < 1) {
    notFound();
  }

  const realizationIdTyped = realizationId as Id<"realizaciones">;

  return (
    <StepByStepView
      key={`${realizationId}-${pasoNumero}`}
      realizationId={realizationIdTyped}
      stepNumber={pasoNumero}
    />
  );
}
