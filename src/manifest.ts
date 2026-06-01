import type { GameManifest } from "@open-party-lab/game-core";

export const magicArenaManifest = {
  id: "magic-arena",
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
  phaseDurations: {
    roundIntroMs: 1_600,
    countdownMs: 1_600,
    lockedMs: 3_000,
    resultMs: 5_000,
    scoreboardMs: 5_000
  }
} as const satisfies GameManifest;

export const manifest = magicArenaManifest;
