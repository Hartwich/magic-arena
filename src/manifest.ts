import { catalogText } from "./catalogText.js";
import type { GameManifest } from "@open-party-lab/game-core";
import {
  MAGIC_ARENA_DEFAULT_PLANNING_MODE,
  magicArenaRoomSettingKeys
} from "./server/magicArenaConfig.js";

export const magicArenaManifest = {
  id: "magic-arena",
  translations: catalogText,
  displayName: "Magic Arena",
  description: "Rundenbasierte 3D-Hex-Taktik mit Karten, Wasserloechern und verdeckter Planung.",
  minPlayers: 2,
  maxPlayers: 4,
  hostView: "MagicArenaHostScene",
  controllerView: "magic-arena",
  controllerLayout: "magic_arena",
  supportsTeams: false,
  estimatedRoundDurationMs: 240_000,
  roundCompletionMode: "wait_for_ready",
  lobbySetup: {
    title: "Magic Arena Setup",
    description: "Waehle, wie die Zuege gespielt werden.",
    fields: [
      {
        kind: "select",
        id: "planningMode",
        settingKey: magicArenaRoomSettingKeys.planningMode,
        actionKey: "planningMode",
        label: "Zugplanung",
        defaultValue: MAGIC_ARENA_DEFAULT_PLANNING_MODE,
        options: [
          {
            id: "planned",
            label: "Vorausplanen",
            description: "Alle vier Zuege werden verdeckt geplant und dann gemeinsam ausgefuehrt."
          },
          {
            id: "sequential",
            label: "Zug fuer Zug",
            description: "Die Spieler ziehen nacheinander: Jeder Zug wird sofort ausgefuehrt."
          }
        ]
      }
    ]
  },
  phaseDurations: {
    roundIntroMs: 1_600,
    countdownMs: 1_600,
    lockedMs: 3_000,
    resultMs: 5_000,
    scoreboardMs: 5_000
  },

  ownsScreens: ["round_intro", "result"],
  visual: { accent: "#6f6aa0", icon: "sparkles", eyebrow: "Magic" },
  audio: { track: { profile: "battle", bpm: 104, rootMidi: 48, masterGain: 0.15 } },
} as const satisfies GameManifest;

export const manifest = magicArenaManifest;
