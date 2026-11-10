import { Smile, Meh, Moon, Frown, Angry, Annoyed, type LucideIcon } from "lucide-react";

export type Mood =
  | "feliz"
  | "tranquila"
  | "cansada"
  | "triste"
  | "enfadada"
  | "nerviosa";

export const MOOD_OPTIONS: { value: Mood; label: string; icon: LucideIcon }[] = [
  { value: "feliz", label: "Feliz", icon: Smile },
  { value: "tranquila", label: "Tranquila", icon: Meh },
  { value: "cansada", label: "Cansada", icon: Moon },
  { value: "triste", label: "Triste", icon: Frown },
  { value: "enfadada", label: "Enfadada", icon: Angry },
  { value: "nerviosa", label: "Nerviosa", icon: Annoyed },
];

export const MOOD_LABEL = Object.fromEntries(
  MOOD_OPTIONS.map((m) => [m.value, m.label]),
) as Record<Mood, string>;
