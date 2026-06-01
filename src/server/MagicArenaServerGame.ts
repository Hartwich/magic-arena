import type { ServerGame } from "@open-party-lab/game-core";
import type {
  MagicArenaControllerState,
  MagicArenaInput,
  MagicArenaPublicState
} from "../protocol.js";
import { magicArenaManifest } from "../manifest.js";
import {
  buildMagicArenaScore,
  createMagicArenaInitialState,
  handleMagicArenaInput,
  isMagicArenaFinished,
  startMagicArenaRound,
  tickMagicArena,
  toMagicArenaControllerState,
  toMagicArenaPublicState,
  type MagicArenaRuntimeState
} from "./magicArenaRules.js";

export const magicArenaServerGame: ServerGame<
  MagicArenaRuntimeState,
  MagicArenaInput,
  MagicArenaPublicState | MagicArenaControllerState
> = {
  manifest: magicArenaManifest,
  createInitialState(context) {
    return createMagicArenaInitialState(context);
  },
  startRound(_state, context) {
    return startMagicArenaRound(context);
  },
  handleInput(state, input, context) {
    return handleMagicArenaInput(state, input, context);
  },
  tick(state, deltaMs, context) {
    return tickMagicArena(state, deltaMs, context);
  },
  isRoundFinished(state) {
    return isMagicArenaFinished(state);
  },
  buildScore(state) {
    return buildMagicArenaScore(state);
  },
  toPublicState(state, context) {
    return toMagicArenaPublicState(state, context);
  },
  toControllerStateForPlayer(state, context, playerId) {
    return toMagicArenaControllerState(state, context, playerId);
  }
};
