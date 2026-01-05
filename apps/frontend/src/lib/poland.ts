import { VoivodeshipSchema } from "@savemate/shared-validation";

export type Voivodeship = (typeof VoivodeshipSchema.options)[number];

export const VOIVODESHIP_LABELS = {
  DOLNOSLASKIE: "Dolnośląskie",
  KUJAWSKO_POMORSKIE: "Kujawsko-Pomorskie",
  LUBELSKIE: "Lubelskie",
  LUBUSKIE: "Lubuskie",
  LODZKIE: "Łódzkie",
  MALOPOLSKIE: "Małopolskie",
  MAZOWIECKIE: "Mazowieckie",
  OPOLSKIE: "Opolskie",
  PODKARPACKIE: "Podkarpackie",
  PODLASKIE: "Podlaskie",
  POMORSKIE: "Pomorskie",
  SLASKIE: "Śląskie",
  SWIETOKRZYSKIE: "Świętokrzyskie",
  WARMINSKO_MAZURSKIE: "Warmińsko-Mazurskie",
  WIELKOPOLSKIE: "Wielkopolskie",
  ZACHODNIOPOMORSKIE: "Zachodniopomorskie",
} satisfies Record<Voivodeship, string>;

export function formatVoivodeshipLabel(value: string): string {
  return (
    VOIVODESHIP_LABELS[value as Voivodeship] ??
    value
      .toLowerCase()
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("-")
  );
}
