"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Check, Play } from "lucide-react";
import { api } from "convex/_generated/api";

type Theme = "crema" | "alto_contraste" | "azul_calma" | "noche";
type FontSize = "normal" | "grande" | "muy_grande";

const THEME_OPTIONS: {
  value: Theme;
  label: string;
  description: string;
  cardBg: string;
  pageBg: string;
  border: string;
  text: string;
  buttonBg: string;
  buttonText: string;
}[] = [
  {
    value: "crema",
    label: "Crema",
    description: "La de siempre",
    cardBg: "bg-white",
    pageBg: "bg-guiame-cream",
    border: "border-gray-200",
    text: "text-gray-900",
    buttonBg: "bg-guiame-teal",
    buttonText: "text-white",
  },
  {
    value: "alto_contraste",
    label: "Alto contraste",
    description: "Negro y amarillo",
    cardBg: "bg-black",
    pageBg: "bg-black",
    border: "border-yellow-400",
    text: "text-white",
    buttonBg: "bg-yellow-400",
    buttonText: "text-black",
  },
  {
    value: "azul_calma",
    label: "Azul calma",
    description: "Azules suaves",
    cardBg: "bg-blue-50",
    pageBg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-950",
    buttonBg: "bg-blue-600",
    buttonText: "text-white",
  },
  {
    value: "noche",
    label: "Noche",
    description: "Fondo oscuro, menos brillo",
    cardBg: "bg-gray-900",
    pageBg: "bg-gray-900",
    border: "border-amber-400",
    text: "text-white",
    buttonBg: "bg-amber-400",
    buttonText: "text-black",
  },
];

const FONT_SIZE_OPTIONS: { value: FontSize; label: string; percent: string; scale: string }[] = [
  { value: "normal", label: "Normal", percent: "100 %", scale: "text-base" },
  { value: "grande", label: "Grande", percent: "125 %", scale: "text-lg" },
  { value: "muy_grande", label: "Muy grande", percent: "150 %", scale: "text-xl" },
];

export default function ColoresPage() {
  const settings = useQuery(api.displaySettings.getMine, {});
  const updateMine = useMutation(api.displaySettings.updateMine);

  const [theme, setTheme] = useState<Theme>("crema");
  const [fontSize, setFontSize] = useState<FontSize>("normal");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) {
      setTheme(settings.theme);
      setFontSize(settings.fontSize);
    }
  }, [settings]);

  async function handleSave() {
    setIsSaving(true);
    try {
      await updateMine({ theme, fontSize });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold text-gray-900">Mis colores</h1>
      <p className="mt-2 text-gray-500">
        Elige cómo quieres ver tu agenda. Tu tutor o tutora también puede cambiarlo.
      </p>

      <h2 className="mt-8 mb-3 text-lg font-bold text-gray-800">Colores</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {THEME_OPTIONS.map((opt) => {
          const isSelected = theme === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTheme(opt.value)}
              className={`rounded-2xl border-2 p-3 text-left transition ${
                isSelected ? "border-guiame-teal" : "border-transparent"
              } bg-white shadow-sm`}
            >
              <div
                className={`mb-3 flex items-center justify-between rounded-xl border p-2 ${opt.cardBg} ${opt.border}`}
              >
                <span className={`text-sm font-semibold ${opt.text}`}>Comedor</span>
                <span className={`rounded-full p-1 ${opt.buttonBg} ${opt.buttonText}`}>
                  <Play className="h-3 w-3" />
                </span>
              </div>
              <p className="font-semibold text-gray-900">{opt.label}</p>
              <p className="text-sm text-gray-500">{opt.description}</p>
            </button>
          );
        })}
      </div>

      <h2 className="mt-8 mb-3 text-lg font-bold text-gray-800">Tamaño de letra</h2>
      <div className="grid grid-cols-3 gap-4">
        {FONT_SIZE_OPTIONS.map((opt) => {
          const isSelected = fontSize === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setFontSize(opt.value)}
              className={`rounded-2xl border-2 bg-white px-4 py-6 text-center transition ${
                isSelected ? "border-guiame-teal" : "border-transparent"
              } shadow-sm`}
            >
              <p className={`font-bold text-gray-900 ${opt.scale}`}>Aa</p>
              <p className="mt-2 font-semibold text-gray-800">{opt.label}</p>
              <p className="text-sm text-gray-500">{opt.percent}</p>
            </button>
          );
        })}
      </div>

      <button
        onClick={handleSave}
        disabled={isSaving}
        className="mt-8 flex items-center gap-2 rounded-xl bg-guiame-teal px-6 py-3 font-semibold text-white transition hover:bg-guiame-teal-dark disabled:opacity-50"
      >
        <Check className="h-5 w-5" /> {saved ? "Guardado" : "Guardar"}
      </button>
    </main>
  );
}
