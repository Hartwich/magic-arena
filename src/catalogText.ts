import type { LocalizedGameTextMap } from "@open-party-lab/game-core";

export const catalogText = {
  "de": {
    "displayName": "Magic Arena",
    "description": "Rundenbasierte 3D-Hex-Taktik mit Karten, Wasserlöchern und verdeckter Planung.",
    "visual": {
      "eyebrow": "Magie"
    }
  },
  "en": {
    "displayName": "Magic Arena",
    "description": "Turn-based 3D hex tactics with cards, water hazards and secret planning.",
    "visual": {
      "eyebrow": "Magic"
    },
    "lobbySetup": {
      "title": "Magic Arena setup",
      "description": "Choose how turns are played.",
      "fields": {
        "planningMode": {
          "label": "Turn planning",
          "options": {
            "planned": {
              "label": "Plan ahead",
              "description": "Plan all four turns in secret, then resolve them together."
            },
            "sequential": {
              "label": "One turn at a time",
              "description": "Players take turns, with each move resolving immediately."
            }
          }
        }
      }
    }
  }
} satisfies LocalizedGameTextMap;
