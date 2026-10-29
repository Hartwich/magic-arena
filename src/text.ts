/** Game-owned presentation copy; technical action/card IDs stay unchanged. */
const englishText: Record<string, string> = {
  "Sprint": "Sprint",
  "Bewegung": "Move",
  "Bewege eine Figur ueber einen geplanten Pfad bis zu 4 Hexfelder.": "Move a figure along a planned path of up to 4 hexes.",
  "Stosslauf": "Charge",
  "Bewegung/Angriff": "Move / Attack",
  "Laufe geradeaus bis zu 3 Felder. Ein getroffener Gegner erhaelt 1 Schaden und wird geschoben.": "Charge straight ahead up to 3 hexes. An enemy you hit takes 1 damage and is pushed.",
  "Gegner-Tausch": "Enemy Swap",
  "Trick": "Trick",
  "Tausche die aktive Figur mit einer gegnerischen Figur in Reichweite 3.": "Swap your active figure with an enemy figure within range 3.",
  "Blitzschlag": "Lightning Strike",
  "Angriff": "Attack",
  "Alle Figuren auf der Zielkoordinate, auch im Wasser, erhalten 2 Schaden.": "All figures at the target coordinate, including those in water, take 2 damage.",
  "Feuerball": "Fireball",
  "Angriff/Terrain": "Attack / Terrain",
  "Alle Figuren auf der Zielkoordinate erhalten 1 Schaden. Das Feld erhaelt 2 Feldschaden.": "All figures at the target coordinate take 1 damage. The tile takes 2 terrain damage.",
  "Hammerstoss": "Hammer Blow",
  "Nahkampfangriff": "Melee attack",
  "Ein Gegner im eigenen oder angrenzenden Feld erhaelt 2 Schaden und wird geschoben.": "An enemy in your tile or an adjacent tile takes 2 damage and is pushed.",
  "Bombe": "Bomb",
  "Angriff/Terrain/verzoegert": "Attack / Terrain / Delayed",
  "Lege eine Bombe. Sie explodiert am Anfang des naechsten globalen Aktionsslots.": "Place a bomb. It explodes at the start of the next global action slot.",
  "Meteorschlag": "Meteor Strike",
  "Zentrum: 2 Figurenschaden und 3 Feldschaden. Nachbarn: 1 Feldschaden.": "Centre: 2 figure damage and 3 terrain damage. Adjacent tiles: 1 terrain damage.",
  "Riss": "Rift",
  "Terrain": "Terrain",
  "Ein existierendes Feld erhaelt 3 Feldschaden.": "Deal 3 terrain damage to an existing tile.",
  "Erdbeben": "Earthquake",
  "Alle angrenzenden existierenden Felder erhalten 1 Feldschaden.": "All adjacent existing tiles take 1 terrain damage.",
  "Plattformbruch": "Platform Break",
  "Ein beschaedigtes Feld mit 2 oder weniger HP wird sofort zerstoert.": "Immediately destroy a damaged tile with 2 HP or less.",
  "Tarnung": "Stealth",
  "Die aktive Figur ist bis zum Ende der naechsten Runde verborgen, bis sie Schaden verursacht.": "Hide your active figure until the end of the next round, or until it deals damage.",
  "Schubwelle": "Shockwave",
  "Angriff/Trick": "Attack / Trick",
  "Alle angrenzenden gegnerischen Figuren erhalten 1 Schaden und werden weggeschoben.": "All adjacent enemy figures take 1 damage and are pushed away.",
  "Kettenblitz": "Chain Lightning",
  "Trifft eine Figur fuer 2 Schaden und springt bis zu zweimal fuer je 1 Schaden weiter.": "Hit one figure for 2 damage, then arc to up to two other figures for 1 damage each.",
  "Fallgrube": "Pitfall",
  "Falle/Terrain": "Trap / Terrain",
  "Platziert eine verdeckte Falle. Beim Betreten: 1 Figurenschaden und 2 Feldschaden.": "Place a hidden trap. Entering it deals 1 figure damage and 2 terrain damage.",
  "Teleport": "Teleport",
  "Teleportiert die aktive Figur auf ein freies, intaktes Feld in Reichweite 4.": "Teleport your active figure to a free, intact tile within range 4.",
  "Krake": "Kraken",
  "Wasser-Angriff": "Water attack",
  "Eine Figur im Wasser erhaelt 2 Schaden und wird ein Feld zur Kartenmitte gezogen.": "A figure in water takes 2 damage and is pulled one hex toward the board centre.",
  "Zeitriss": "Time Rift",
  "Verzoegerter Terrain-Angriff": "Delayed terrain attack",
  "Markiert ein Feld. Zu Beginn der naechsten Runde: 1 Figurenschaden und 3 Feldschaden.": "Mark a tile. At the start of the next round, deal 1 figure damage and 3 terrain damage.",
  "Magische Mine": "Magic Mine",
  "Falle/Explosion": "Trap / Explosion",
  "Platziert eine sichtbare Mine. Beim Ausloesen: Zentrum 1 Schaden und 2 Feldschaden.": "Place a visible mine. When triggered, the centre takes 1 figure damage and 2 terrain damage.",
  "Gewitterwolke": "Storm Cloud",
  "Verzoegerter Flaechenangriff": "Delayed area attack",
  "Markiert ein Feld. Ab naechster Runde trifft sie 2 Runden lang Figuren, die dort stehen oder hindurchlaufen, maximal 1x pro Figur und Runde.": "Mark a tile. Starting next round, the cloud strikes figures standing on or crossing it for 2 rounds, at most once per figure per round.",
  "Der Ablagestapel wird neu gemischt.": "The discard pile is reshuffled.",
  "Magic Arena: Zieht Zug fuer Zug nacheinander und ueberlebt die Hex-Insel.": "Magic Arena: Take turns and survive the hex island.",
  "Magic Arena: Plane vier Aktionen und ueberlebe die Hex-Insel.": "Magic Arena: Plan four actions and survive the hex island.",
  "Magic Arena beginnt. Zieht Zug fuer Zug nacheinander.": "Magic Arena begins. Take one turn at a time.",
  "Magic Arena beginnt. Plant verdeckt eure Aktionen.": "Magic Arena begins. Plan your actions in secret.",
  "Nicht in der Planungsphase.": "It is not the planning phase.",
  "Spieler nicht gefunden.": "Player not found.",
  "Deine Planung ist bereits gesperrt.": "Your plan is already locked.",
  "Du bist gerade nicht am Zug.": "It is not your turn.",
  "Dieser Slot ist nicht verfuegbar.": "This slot is unavailable.",
  "Diese Figur kann nicht handeln.": "This figure cannot act.",
  "Diese Figur ist bereits verplant.": "This figure already has a planned action.",
  "Der Bewegungspfad ist ungueltig.": "The movement path is invalid.",
  "Boxen braucht ein Ziel im eigenen oder angrenzenden Feld.": "Punch needs a target in your tile or an adjacent tile.",
  "Unbekannte Basisaktion.": "Unknown basic action.",
  "Diese Karte liegt nicht auf deiner Hand.": "This card is not in your hand.",
  "Diese Karte ist bereits reserviert.": "This card is already reserved.",
  "Diese Karte ist in Magic Arena nicht mehr verfuegbar.": "This card is no longer available in Magic Arena.",
  "Der Sprintpfad ist ungueltig.": "The sprint path is invalid.",
  "Stosslauf braucht Richtung und Distanz 1-3.": "Charge needs a direction and a distance from 1 to 3.",
  "Das Ziel liegt ausser Reichweite.": "The target is out of range.",
  "Teleport braucht ein freies, intaktes Feld.": "Teleport needs a free, intact tile.",
  "Diese Falle braucht ein freies Feld ohne Objekt.": "This trap needs a free tile with no object.",
  "Gewitterwolke braucht ein freies Ereignisfeld.": "Storm Cloud needs a tile with no active event.",
  "Krake braucht eine Figur im Wasser.": "Kraken needs a figure in the water.",
  "Bombe braucht ein Ziel auf der Karte.": "Bomb needs a target on the board.",
  "Hammerstoss im eigenen Feld braucht eine Schubrichtung.": "Hammer Blow in your own tile needs a push direction.",
  "Feldzerstoerung": "Tile destruction",
  "Sprengfeld": "Explosive tile",
  "Rissfeld": "Cracked tile",
  "Duennen Boden": "Thin floor",
  "Ein Kristall flackert auf, findet aber kein freies Feld.": "A crystal flickers into view, but there is no free tile.",
  "Boxen": "Punch",
  "Graben": "Dig",
  "vergrabene Bombe": "buried bomb",
  "Stosslauf trifft nur eigene Figuren und stoppt.": "Charge hits only friendly figures and stops.",
  "Gegner-Tausch scheitert: Ziel ausser Reichweite.": "Enemy Swap failed: target out of range.",
  "Gegner-Tausch findet keinen Gegner.": "Enemy Swap found no enemy.",
  "Hammerstoss scheitert: Ziel ausser Reichweite.": "Hammer Blow failed: target out of range.",
  "Bombe kann nicht gelegt werden.": "The bomb cannot be placed.",
  "Meteorschlag scheitert: Ziel ausser Reichweite.": "Meteor Strike failed: target out of range.",
  "Magnetzug scheitert: Ziel ausser Reichweite.": "Magnetic Pull failed: target out of range.",
  "Magnetzug findet kein gueltiges Ziel.": "Magnetic Pull found no valid target.",
  "Magnetzug": "Magnetic Pull",
  "Magnetzug wird von einem vollen Feld blockiert.": "Magnetic Pull is blocked by a full tile.",
  "Kettenblitz scheitert: Ziel ausser Reichweite.": "Chain Lightning failed: target out of range.",
  "Kettenblitz findet kein erstes Ziel.": "Chain Lightning found no initial target.",
  "Fallgrube kann hier nicht platziert werden.": "A pitfall cannot be placed here.",
  "Teleport scheitert: Ziel muss frei, intakt und in Reichweite sein.": "Teleport failed: the target must be free, intact and within range.",
  "Krake scheitert: Ziel ausser Reichweite.": "Kraken failed: target out of range.",
  "Krake findet keine Figur im Wasser.": "Kraken found no figure in the water.",
  "Zeitriss kann hier nicht markiert werden.": "Time Rift cannot mark this tile.",
  "Magische Mine kann hier nicht platziert werden.": "A Magic Mine cannot be placed here.",
  "Gewitterwolke kann hier nicht markiert werden.": "Storm Cloud cannot mark this tile.",
  "Platztausch findet keine zweite eigene Figur.": "Swap found no second friendly figure.",
  "Platztausch": "Swap",
  "Blitzschlag scheitert: Ziel ausser Reichweite.": "Lightning Strike failed: target out of range.",
  "Feuerball scheitert: Ziel ausser Reichweite.": "Fireball failed: target out of range.",
  "Riss scheitert: Ziel muss ein existierendes Feld in Reichweite sein.": "Rift failed: the target must be an existing tile within range.",
  "Plattformbruch scheitert: Ziel ausser Reichweite.": "Platform Break failed: target out of range.",
  "Plattformbruch scheitert: Feld ist noch zu stabil.": "Platform Break failed: the tile is still too strong.",
  "Unbekannte Karte verpufft.": "The unknown card fizzles.",
  "Basisaktion": "Basic action",
  "Karte": "Card",
  "Die geplante Aktion verfaellt: ausfuehrende Figur kann nicht handeln.": "The planned action is cancelled: its figure cannot act.",
  "Slotende": "End of slot",
  "Flutwelle": "Tidal Wave",
  "Eine Seite der Arena wird markiert. Am Rundenende bekommen diese Randfelder 2 Feldschaden.": "One side of the arena is marked. At round end, those edge tiles take 2 terrain damage.",
  "Instabile Arena": "Unstable Arena",
  "Am Rundenende bekommen alle Felder mit 2 oder weniger HP 1 Feldschaden.": "At round end, all tiles with 2 HP or less take 1 terrain damage.",
  "Erdbebenwarnung": "Earthquake Warning",
  "Sechs markierte Felder bekommen am Rundenende jeweils 2 Feldschaden.": "Six marked tiles each take 2 terrain damage at round end.",
  "Arkane Ueberladung": "Arcane Overload",
  "Direkter Feldschaden von Karten verursacht auf dem Hauptziel +1 Feldschaden.": "Direct terrain damage from cards deals +1 terrain damage to the main target.",
  "Jeder Feldschaden hat zusaetzlich 10% Chance auf 1 weiteren Feldschaden.": "Each instance of terrain damage has a 10% chance to deal 1 additional terrain damage.",
  "Schatzduft": "Treasure Scent",
  "Graben ist staerker: Nichts wird zu 1 Karte, kleine Truhen ziehen 2 Karten.": "Digging is stronger: finding nothing grants 1 card; small chests grant 2 cards.",
  "Flutwelle trifft die markierten Randfelder.": "Tidal Wave hits the marked edge tiles.",
  "Instabile Arena laesst beschaedigte Felder nachgeben.": "Unstable Arena makes damaged tiles collapse.",
  "Erdbebenwarnung trifft die markierten Felder.": "Earthquake Warning hits the marked tiles.",
  "Die Arena zieht sich stark zusammen": "The arena shrinks rapidly",
  "Die Arena zieht sich zusammen": "The arena shrinks",
  "Arenarand": "Arena edge",
  "Rettungsfrist": "Rescue deadline",
  "Magic Arena endet ohne Sieger.": "Magic Arena ends with no winner.",
  "Der Zug ist unvollstaendig.": "The turn is incomplete.",
  "Magic Arena Sieg": "Magic Arena victory"
};

const patterns: Array<[string, string, number[]?]> = [
  [
    "Rundenereignis: $1",
    "Round event: $1",
    [
      1
    ]
  ],
  [
    "Runde $1: Planungsphase beginnt.",
    "Round $1: planning begins."
  ],
  [
    "Runde $1: Zug-fuer-Zug-Phase beginnt.",
    "Round $1: turn-by-turn play begins."
  ],
  [
    "$1 ist am Zug.",
    "It is $1’s turn."
  ],
  [
    "$1 wurde eliminiert ($2).",
    "$1 was eliminated ($2).",
    [
      2
    ]
  ],
  [
    "$1 faellt ins Wasser ($2).",
    "$1 falls into the water ($2).",
    [
      2
    ]
  ],
  [
    "$1 erhaelt $2 Schaden ($3).",
    "$1 takes $2 damage ($3).",
    [
      3
    ]
  ],
  [
    "Feld $1 wurde zerstoert ($2).",
    "Tile $1 was destroyed ($2).",
    [
      2
    ]
  ],
  [
    "Sprengfeld $1 explodiert.",
    "Explosive tile $1 explodes."
  ],
  [
    "Feld $1 erhaelt $2 Schaden ($3).",
    "Tile $1 takes $2 damage ($3).",
    [
      3
    ]
  ],
  [
    "Rissfeld $1 bricht spontan.",
    "Cracked tile $1 suddenly collapses."
  ],
  [
    "Duennen Boden auf $1 gibt weiter nach.",
    "The thin floor at $1 gives way further."
  ],
  [
    "$1 versucht $2 zu retten. Aber kein Rettungsfeld vorhanden.",
    "$1 tries to rescue $2, but there is no safe landing tile."
  ],
  [
    "$1 rettet $2 nach $3.",
    "$1 rescues $2 to $3."
  ],
  [
    "Fallgrube auf $1 wird ausgeloest.",
    "Pitfall at $1 is triggered."
  ],
  [
    "Magische Mine auf $1 wird ausgeloest ($2).",
    "Magic Mine at $1 is triggered ($2).",
    [
      2
    ]
  ],
  [
    "Kristallfeld $1: $2 zieht 1 Karte.",
    "Crystal tile $1: $2 draws 1 card."
  ],
  [
    "Kristallfeld $1 leuchtet auf, aber die Hand ist voll.",
    "Crystal tile $1 lights up, but the hand is full."
  ],
  [
    "Ein Kristallfeld erscheint auf $1.",
    "A crystal tile appears at $1."
  ],
  [
    "Gewitterwolke auf $1 trifft $2 ($3).",
    "Storm Cloud at $1 hits $2 ($3).",
    [
      3
    ]
  ],
  [
    "Kettenschub-Limit erreicht ($1).",
    "Chain-push limit reached ($1).",
    [
      1
    ]
  ],
  [
    "Kettenschub: $1 wird weitergeschoben.",
    "Chain push: $1 is pushed further."
  ],
  [
    "$1 kann nicht geschoben werden: Kette blockiert.",
    "$1 cannot be pushed: the chain is blocked."
  ],
  [
    "$1 wird nach $2 geschoben.",
    "$1 is pushed to $2."
  ],
  [
    "$1 kann $2 nicht ausfuehren.",
    "$1 cannot perform $2.",
    [
      2
    ]
  ],
  [
    "$1 stoppt vor einem vollen Feld.",
    "$1 stops before a full tile."
  ],
  [
    "$1 bewegt sich nach $2.",
    "$1 moves to $2."
  ],
  [
    "$1 tauscht Platz mit $2 ($3).",
    "$1 swaps places with $2 ($3).",
    [
      3
    ]
  ],
  [
    "$1 boxt ins Leere.",
    "$1 punches thin air."
  ],
  [
    "$1 kann hier nicht graben.",
    "$1 cannot dig here."
  ],
  [
    "$1 hat nichts gefunden.",
    "$1 found nothing."
  ],
  [
    "$1 hat $2 Karte$3 gefunden.",
    "$1 found $2 cards."
  ],
  [
    "$1 hat eine Truhe gefunden, aber die Hand ist voll.",
    "$1 found a chest, but the hand is full."
  ],
  [
    "$1 findet $2 Karte$3.",
    "$1 finds $2 cards."
  ],
  [
    "$1 hat eine vergrabene Bombe gefunden.",
    "$1 found a buried bomb."
  ],
  [
    "$1 findet eine vergrabene Bombe.",
    "$1 finds a buried bomb."
  ],
  [
    "$1 hat instabilen Boden gefunden.",
    "$1 found unstable ground."
  ],
  [
    "$1 legt instabilen Boden frei.",
    "$1 uncovers unstable ground."
  ],
  [
    "$1 hat durch Schatzduft 1 Karte gefunden.",
    "$1 found 1 card thanks to Treasure Scent."
  ],
  [
    "$1 findet durch Schatzduft 1 Karte.",
    "$1 finds 1 card thanks to Treasure Scent."
  ],
  [
    "$1 findet nichts.",
    "$1 finds nothing."
  ],
  [
    "$1 beendet Stosslauf auf $2.",
    "$1 finishes Charge at $2."
  ],
  [
    "$1 legt eine Bombe auf $2.",
    "$1 places a bomb at $2."
  ],
  [
    "$1 wird nach $2 gezogen.",
    "$1 is pulled to $2."
  ],
  [
    "$1 verliert die Tarnung.",
    "$1 loses stealth."
  ],
  [
    "Kettenblitz springt auf $1.",
    "Chain Lightning arcs to $1."
  ],
  [
    "$1 legt eine Fallgrube auf $2.",
    "$1 places a pitfall at $2."
  ],
  [
    "$1 teleportiert nach $2.",
    "$1 teleports to $2."
  ],
  [
    "Krake zieht $1 von $2 nach $3.",
    "Kraken pulls $1 from $2 to $3."
  ],
  [
    "Zeitriss auf $1 markiert.",
    "Time Rift marked at $1."
  ],
  [
    "Magische Mine auf $1 platziert.",
    "Magic Mine placed at $1."
  ],
  [
    "Gewitterwolke auf $1 markiert.",
    "Storm Cloud marked at $1."
  ],
  [
    "$1 ist getarnt.",
    "$1 is hidden."
  ],
  [
    "$1 wirkt $2",
    "$1 casts $2",
    [
      2
    ]
  ],
  [
    "$1 wendet $2 an",
    "$1 uses $2",
    [
      2
    ]
  ],
  [
    "$1 nutzt $2 auf $3.",
    "$1 uses $2 at $3.",
    [
      2
    ]
  ],
  [
    "$1 nutzt $2.",
    "$1 uses $2.",
    [
      2
    ]
  ],
  [
    "$1 ist nicht mehr auf der Hand und verpufft.",
    "$1 is no longer in the hand and fizzles.",
    [
      1
    ]
  ],
  [
    "$1 Bombe$2 explodieren",
    "$1 bombs explode"
  ],
  [
    "Bombe auf $1 explodiert.",
    "Bomb at $1 explodes."
  ],
  [
    "Zeitriss auf $1 bricht auf",
    "Time Rift opens at $1"
  ],
  [
    "Zeitriss auf $1 wird ausgeloest.",
    "Time Rift at $1 is triggered."
  ],
  [
    "$1 Gewitterwolke$2 treffen Figuren",
    "$1 storm clouds strike figures"
  ],
  [
    "$1 wird ausgeloest",
    "$1 is triggered",
    [
      1
    ]
  ],
  [
    "Rundenereignis: $1.",
    "Round event: $1.",
    [
      1
    ]
  ],
  [
    "$1 endet.",
    "$1 ends.",
    [
      1
    ]
  ],
  [
    "Der Arenarand bekommt $1 Feldschaden auf $2 Feld(ern).",
    "The arena edge takes $1 terrain damage on $2 tiles."
  ],
  [
    "Runde $1: Ausfuehrung startet.",
    "Round $1: execution begins."
  ],
  [
    "$1 gewinnt Magic Arena!",
    "$1 wins Magic Arena!"
  ],
  [
    "Runde $1 endet",
    "Round $1 ends"
  ],
  [
    "$1 plant Slot $2.",
    "$1 plans slot $2."
  ],
  [
    "$1 ist gerade nicht am Zug.",
    "It is not $1’s turn."
  ],
  [
    "$1 braucht noch $2 Planungsslot(s).",
    "$1 still needs $2 planning slots."
  ],
  [
    "$1 ist bereit.",
    "$1 is ready."
  ]
];

const compiledPatterns = [...patterns].sort((left, right) => right[0].replace(/\$\d+/g, "").length - left[0].replace(/\$\d+/g, "").length).map(([source, translation, translatedSlots = []]) => {
  const slots: number[] = [];
  const escaped = source.split(/(\$\d+)/).map(part => {
    if (/^\$\d+$/.test(part)) { slots.push(Number(part.slice(1))); return "([\\s\\S]*?)"; }
    return part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }).join("");
  return { expression: new RegExp("^" + escaped + "$"), slots, translation, translatedSlots };
});

/** Translate generated display copy only; never technical IDs or player names. */
export function arenaText(value: string, language: string | undefined): string {
  if (language !== "en") return value;
  if (value.endsWith(", Arkane Ueberladung")) return arenaText(value.slice(0, -", Arkane Ueberladung".length), language) + ", Arcane Overload";
  const exact = englishText[value];
  if (exact) return exact;
  if (value.includes("\n")) return value.split("\n").map(line => arenaText(line, language)).join("\n");
  for (const pattern of compiledPatterns) {
    const match = pattern.expression.exec(value);
    if (!match) continue;
    return pattern.translation.replace(/\$(\d+)/g, (_token, number: string) => {
      const slot = Number(number);
      const capture = match[pattern.slots.indexOf(slot) + 1] ?? "";
      return pattern.translatedSlots.includes(slot) ? arenaText(capture, language) : capture;
    });
  }
  return value;
}
