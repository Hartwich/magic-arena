import type {
  MagicArenaCardDefinition,
  MagicArenaCardId,
  MagicArenaCardInstanceState
} from "../protocol.js";

export const magicArenaCardDefinitions = [
  {
    cardId: "sprint",
    name: "Sprint",
    type: "Bewegung",
    frequency: 8,
    range: 4,
    description: "Bewege eine Figur ueber einen geplanten Pfad bis zu 4 Hexfelder."
  },
  {
    cardId: "charge_run",
    name: "Stosslauf",
    type: "Bewegung/Angriff",
    frequency: 6,
    range: 3,
    description: "Laufe geradeaus bis zu 3 Felder. Ein getroffener Gegner erhaelt 1 Schaden und wird geschoben."
  },
  {
    cardId: "enemy_swap",
    name: "Gegner-Tausch",
    type: "Trick",
    frequency: 2,
    range: 3,
    description: "Tausche die aktive Figur mit einer gegnerischen Figur in Reichweite 3."
  },
  {
    cardId: "lightning_strike",
    name: "Blitzschlag",
    type: "Angriff",
    frequency: 8,
    range: 5,
    description: "Alle Figuren auf der Zielkoordinate, auch im Wasser, erhalten 2 Schaden."
  },
  {
    cardId: "fireball",
    name: "Feuerball",
    type: "Angriff/Terrain",
    frequency: 6,
    range: 3,
    description: "Alle Figuren auf der Zielkoordinate erhalten 1 Schaden. Das Feld erhaelt 2 Feldschaden."
  },
  {
    cardId: "hammer_blow",
    name: "Hammerstoss",
    type: "Nahkampfangriff",
    frequency: 6,
    range: 1,
    description: "Ein Gegner im eigenen oder angrenzenden Feld erhaelt 2 Schaden und wird geschoben."
  },
  {
    cardId: "bomb",
    name: "Bombe",
    type: "Angriff/Terrain/verzoegert",
    frequency: 5,
    range: 2,
    description: "Lege eine Bombe. Sie explodiert am Anfang des naechsten globalen Aktionsslots."
  },
  {
    cardId: "meteor_strike",
    name: "Meteorschlag",
    type: "Angriff/Terrain",
    frequency: 4,
    range: 4,
    description: "Zentrum: 2 Figurenschaden und 3 Feldschaden. Nachbarn: 1 Feldschaden."
  },
  {
    cardId: "rift",
    name: "Riss",
    type: "Terrain",
    frequency: 6,
    range: 4,
    description: "Ein existierendes Feld erhaelt 3 Feldschaden."
  },
  {
    cardId: "earthquake",
    name: "Erdbeben",
    type: "Terrain",
    frequency: 4,
    range: null,
    description: "Alle angrenzenden existierenden Felder erhalten 1 Feldschaden."
  },
  {
    cardId: "platform_break",
    name: "Plattformbruch",
    type: "Terrain",
    frequency: 3,
    range: 4,
    description: "Ein beschaedigtes Feld mit 2 oder weniger HP wird sofort zerstoert."
  },
  {
    cardId: "stealth",
    name: "Tarnung",
    type: "Trick",
    frequency: 4,
    range: null,
    description: "Die aktive Figur ist bis zum Ende der naechsten Runde verborgen, bis sie Schaden verursacht."
  },
  {
    cardId: "shockwave",
    name: "Schubwelle",
    type: "Angriff/Trick",
    frequency: 3,
    range: 1,
    description: "Alle angrenzenden gegnerischen Figuren erhalten 1 Schaden und werden weggeschoben."
  },
  {
    cardId: "chain_lightning",
    name: "Kettenblitz",
    type: "Angriff",
    frequency: 6,
    range: 4,
    description: "Trifft eine Figur fuer 2 Schaden und springt bis zu zweimal fuer je 1 Schaden weiter."
  },
  {
    cardId: "pitfall",
    name: "Fallgrube",
    type: "Falle/Terrain",
    frequency: 5,
    range: 2,
    description: "Platziert eine verdeckte Falle. Beim Betreten: 1 Figurenschaden und 2 Feldschaden."
  },
  {
    cardId: "teleport",
    name: "Teleport",
    type: "Bewegung",
    frequency: 5,
    range: 4,
    description: "Teleportiert die aktive Figur auf ein freies, intaktes Feld in Reichweite 4."
  },
  {
    cardId: "kraken",
    name: "Krake",
    type: "Wasser-Angriff",
    frequency: 4,
    range: 5,
    description: "Eine Figur im Wasser erhaelt 2 Schaden und wird ein Feld zur Kartenmitte gezogen."
  },
  {
    cardId: "time_rift",
    name: "Zeitriss",
    type: "Verzoegerter Terrain-Angriff",
    frequency: 5,
    range: 4,
    description: "Markiert ein Feld. Zu Beginn der naechsten Runde: 1 Figurenschaden und 3 Feldschaden."
  },
  {
    cardId: "magic_mine",
    name: "Magische Mine",
    type: "Falle/Explosion",
    frequency: 5,
    range: 2,
    description: "Platziert eine sichtbare Mine. Beim Ausloesen: Zentrum 1 Schaden und 2 Feldschaden."
  },
  {
    cardId: "storm_cloud",
    name: "Gewitterwolke",
    type: "Verzoegerter Flaechenangriff",
    frequency: 5,
    range: 4,
    description: "Markiert ein Feld. Ab naechster Runde trifft sie 2 Runden lang Figuren, die dort stehen oder hindurchlaufen, maximal 1x pro Figur und Runde."
  }
] as const satisfies MagicArenaCardDefinition[];

export const magicArenaCardDefinitionsById = Object.fromEntries(
  magicArenaCardDefinitions.map((definition) => [definition.cardId, definition])
) as Partial<Record<MagicArenaCardId, MagicArenaCardDefinition>>;

export function createMagicArenaDeck(): MagicArenaCardInstanceState[] {
  const deck: MagicArenaCardInstanceState[] = [];

  for (const definition of magicArenaCardDefinitions) {
    for (let index = 1; index <= definition.frequency; index += 1) {
      deck.push({
        instanceId: `${definition.cardId}-${index}`,
        cardId: definition.cardId
      });
    }
  }

  return deck;
}

export function getMagicArenaDeckSize(): number {
  return magicArenaCardDefinitions.reduce((sum, definition) => sum + definition.frequency, 0);
}
