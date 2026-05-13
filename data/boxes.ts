import { BoxFormat } from "@/types";

export const BOX_FORMATS: BoxFormat[] = [
  {
    id: "box-10",
    name: "Box Degustazione 10 kg",
    totalKg: 10,
    price: 150,
    recommendedFor: "Perfetta per famiglie curiose, cene speciali e una prima degustazione completa.",
    categoryRules: [
      {
        category: "top",
        label: "Tagli top",
        requiredKg: 3,
        minDistinctCuts: 2,
        advisoryMessage: "La parte wow della box: tagli da brace, padella e servizio importante.",
      },
      {
        category: "premium",
        label: "Tagli premium",
        requiredKg: 4,
        minDistinctCuts: 2,
        advisoryMessage: "Il cuore versatile della degustazione: gusto, resa e grande soddisfazione.",
      },
      {
        category: "base",
        label: "Tagli base",
        requiredKg: 3,
        minDistinctCuts: 2,
        advisoryMessage: "I tagli quotidiani che rendono la box davvero completa e conveniente.",
      },
    ],
  },
  {
    id: "box-20",
    name: "Box Degustazione 20 kg",
    totalKg: 20,
    price: 300,
    recommendedFor: "Ideale per famiglie numerose, acquisti condivisi e chi vuole fare scorta bene.",
    categoryRules: [
      {
        category: "top",
        label: "Tagli top",
        requiredKg: 6,
        minDistinctCuts: 2,
        advisoryMessage: "Più spazio per i tagli protagonisti, senza perdere equilibrio.",
      },
      {
        category: "premium",
        label: "Tagli premium",
        requiredKg: 8,
        minDistinctCuts: 2,
        advisoryMessage: "La categoria più duttile: ottima per alternare cotture e momenti di consumo.",
      },
      {
        category: "base",
        label: "Tagli base",
        requiredKg: 6,
        minDistinctCuts: 2,
        advisoryMessage: "La riserva di tutti i giorni che fa rendere al massimo la convenienza della box.",
      },
    ],
  },
];
