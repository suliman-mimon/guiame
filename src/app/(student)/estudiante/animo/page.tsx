"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Check } from "lucide-react";
import { api } from "convex/_generated/api";
import { todayDateString } from "@/lib/dates";
import { MOOD_OPTIONS, type Mood } from "@/lib/moods";

export default function AnimoPage() {
  const date = todayDateString();
  const todayMood = useQuery(api.moods.getTodayForStudent, { date });
  const setToday = useMutation(api.moods.setToday);

  const [selected, setSelected] = useState<Mood | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const alreadyChosen = todayMood !== undefined && todayMood !== null;
  const current = alreadyChosen ? todayMood.mood : selected;

  async function handleSave() {
    if (selected === null || alreadyChosen) return;
    setIsSaving(true);
    try {
      await setToday({ date, mood: selected });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold text-gray-900">¿Cómo te sientes hoy?</h1>
      <p className="mt-2 text-gray-500">
        {alreadyChosen
          ? "Ya elegiste tu cara de hoy. ¡Vuelve mañana para elegir otra vez!"
          : "Elige una cara. Solo puedes elegir una vez al día."}
      </p>

      <div className="mt-6 grid max-w-2xl grid-cols-3 gap-4">
        {MOOD_OPTIONS.map(({ value, label, icon: Icon }) => {
          const isSelected = current === value;
          return (
            <button
              key={value}
              type="button"
              disabled={alreadyChosen}
              onClick={() => setSelected(value)}
              className={`flex flex-col items-center gap-3 rounded-2xl border-2 bg-white px-4 py-8 transition ${
                isSelected
                  ? "border-guiame-teal bg-guiame-teal/10"
                  : "border-transparent"
              } ${alreadyChosen && !isSelected ? "opacity-50" : ""}`}
            >
              <Icon
                className={`h-12 w-12 ${isSelected ? "text-guiame-teal" : "text-gray-700"}`}
              />
              <span className="text-lg font-semibold text-gray-800">{label}</span>
            </button>
          );
        })}
      </div>

      {!alreadyChosen && (
        <button
          onClick={handleSave}
          disabled={selected === null || isSaving}
          className="mt-8 flex items-center gap-2 rounded-xl bg-guiame-teal px-6 py-3 font-semibold text-white transition hover:bg-guiame-teal-dark disabled:opacity-50"
        >
          <Check className="h-5 w-5" /> Guardar
        </button>
      )}
    </main>
  );
}
