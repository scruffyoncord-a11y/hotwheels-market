import { placeholderImage } from "./placeholder";
import type { InventoryItem } from "./types";

// Cars the user owns but hasn't listed for trade or auction yet.
export const MOCK_INVENTORY: InventoryItem[] = [
  {
    id: "inv-1",
    title: "Nissan Skyline GT-R (R34) - Fast & Furious",
    castingName: "Nissan Skyline GT-R (R34)",
    series: "Fast & Furious",
    condition: "MINT",
    notes: "Picked up at a local swap meet, still sealed on card.",
    image: placeholderImage("inv-1", "Skyline GT-R"),
    createdAt: "2026-08-27T10:00:00.000Z",
  },
  {
    id: "inv-2",
    title: "Porsche 911 GT3 RS",
    castingName: "Porsche 911 GT3 RS",
    series: "Car Culture",
    condition: "NEAR_MINT",
    notes: "Loose, minor shelf wear on one box corner.",
    image: placeholderImage("inv-2", "911 GT3 RS"),
    createdAt: "2026-08-25T10:00:00.000Z",
  },
];
