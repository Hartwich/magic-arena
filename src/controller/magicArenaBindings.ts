import type {
  MagicArenaPlanSlotInput,
  MagicArenaPlannedAction,
  MagicArenaReadyInput
} from "../protocol.js";

export function createMagicArenaPlanSlotInput(
  playerId: string,
  slotIndex: number,
  action: Omit<MagicArenaPlannedAction, "playerId" | "slotIndex"> | null
): MagicArenaPlanSlotInput {
  return {
    type: "magic-arena:plan-slot",
    playerId,
    slotIndex,
    action,
    sentAt: Date.now()
  };
}

export function createMagicArenaReadyInput(playerId: string): MagicArenaReadyInput {
  return {
    type: "magic-arena:ready",
    playerId,
    sentAt: Date.now()
  };
}
