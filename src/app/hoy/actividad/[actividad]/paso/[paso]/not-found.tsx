import Link from "next/link";

export default function StepNotFound() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-xl font-semibold text-alumno-texto" role="alert">
        No se encontró este paso.
      </p>
      <Link
        className="rounded-xl bg-alumno-primario px-5 py-3 font-bold text-white"
        href="/hoy"
      >
        Volver a hoy
      </Link>
    </div>
  );
}
