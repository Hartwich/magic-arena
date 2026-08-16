import type { MagicArenaControllerState } from "../protocol.js";
import type { MagicArenaLayoutModel } from "./platform-layout-models.js";
import type { ControllerGameRenderContext } from "./platform-registry.js";
import {
  createMagicArenaPlanSlotInput,
  createMagicArenaPlayTurnInput,
  createMagicArenaReadyInput
} from "./magicArenaBindings.js";

export function buildMagicArenaControllerModel(context: ControllerGameRenderContext): MagicArenaLayoutModel {
  const { state, onInput } = context;
  const playerId = state.player?.id ?? "";
  const gameState = (state.game?.state ?? {}) as MagicArenaControllerState;
  const en = state.room?.language === "en";
  const ownPlayer = gameState.ownPlayer;
  const plannedCount = gameState.plannedActionsByPlayer?.[playerId]?.length ?? 0;
  const requiredSlots = ownPlayer?.requiredSlots ?? 0;
  const sequential = gameState.planningMode === "sequential";
  const totalSlots = gameState.totalPlanningSlots ?? 4;
  const planningSlotIndex = gameState.planningSlotIndex ?? 0;
  const isOwnTurn = !sequential || gameState.activePlayerId === playerId;
  const activePlayerName =
    gameState.players?.find((player) => player.playerId === gameState.activePlayerId)?.name ??
    gameState.activePlayerId ??
    "";

  const multiTurnSuffix = totalSlots > 1 ? ` ${planningSlotIndex + 1}/${totalSlots}` : "";
  const planningSubtitle = sequential
    ? isOwnTurn
      ? en
        ? `Your turn${multiTurnSuffix}`
        : `Du bist am Zug${multiTurnSuffix}`
      : en
        ? `Waiting for ${activePlayerName}`
        : `Warte auf ${activePlayerName}`
    : `${en ? "Planning" : "Planung"} ${plannedCount}/${requiredSlots}`;

  return {
    kind: "magic_arena",
    title: "Magic Arena",
    subtitle:
      gameState.magicPhase === "planning"
        ? planningSubtitle
        : gameState.magicPhase === "execution"
          ? en ? "Execution" : "Ausfuehrung"
          : gameState.winnerPlayerId
            ? en ? "Game over" : "Spielende"
            : undefined,
    helperText:
      state.game?.message ??
      (en
        ? "Choose a figure, an action or card, and then target coordinates."
        : "Waehle Figur, Aktion oder Karte und danach Zielkoordinaten."),
    language: state.room?.language,
    disabled:
      state.game?.phase !== "playing" ||
      gameState.magicPhase !== "planning" ||
      !ownPlayer ||
      ownPlayer.ready ||
      (sequential && !isOwnTurn),
    resetKey: `${state.game?.roundNumber ?? 0}:${gameState.roundIndex ?? 0}:${gameState.magicPhase ?? "none"}:${plannedCount}:${ownPlayer?.ready ? "ready" : "open"}:${planningSlotIndex}:${gameState.activePlayerId ?? "-"}`,
    currentPlayerId: playerId,
    state: gameState,
    onPlanSlot: (slotIndex, action) => onInput(createMagicArenaPlanSlotInput(playerId, slotIndex, action)),
    onReady: () => onInput(createMagicArenaReadyInput(playerId)),
    onPlayTurn: (action) => onInput(createMagicArenaPlayTurnInput(playerId, action))
  };
}
