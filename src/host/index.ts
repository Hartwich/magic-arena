import Phaser from "phaser";
import * as THREE from "three";
import type {
  MagicArenaActiveActionState,
  MagicArenaCoord,
  MagicArenaFigureState,
  MagicArenaPublicState
} from "../protocol.js";
import { magicArenaManifest } from "../manifest.js";

interface HostClientLike {
  subscribe(callback: (state: HostAppStateLike) => void): () => void;
}

interface HostAppStateLike {
  game?: {
    state?: unknown;
  } | null;
}

const hexSize = 0.52;
const maxFieldHp = 6;
const actionEffectMs = 1500;
const actionTextLeadMs = 320;
const playerFallbackColors = ["#38bdf8", "#fb7185", "#34d399", "#facc15"];

type MagicArenaActionTimingProfile = {
  textLeadMs: number;
  defaultDurationMs: number;
};

type MagicArenaEffect = (
  | { mode: "pulse"; createdAt: number; baseScale: number }
  | { mode: "bob"; createdAt: number; baseY: number }
  | { mode: "burst"; createdAt: number; baseScale: number; spin?: number }
  | { mode: "digHop"; createdAt: number; baseScale: number; baseY: number }
  | { mode: "ascend"; createdAt: number; baseScale: number; baseY: number; spin?: number }
  | { mode: "strike"; createdAt: number; baseScale: number }
  | { mode: "projectile"; createdAt: number; start: THREE.Vector3; end: THREE.Vector3; spin?: number }
  | { mode: "quake"; createdAt: number; baseScale: number; baseY: number }
  | { mode: "hopPath"; createdAt: number; points: THREE.Vector3[]; baseScale: number; spin?: number }
  | { mode: "rune"; createdAt: number; baseScale: number; baseY: number }
) & { durationMs?: number };

type MagicArenaFigureSnapshot = {
  figureId: string;
  playerId: string;
  name: string;
  status: MagicArenaFigureState["status"];
  coord?: MagicArenaCoord;
  waterCoord?: MagicArenaCoord;
  hp: number;
  maxHp: number;
  rescueDeadlineRound?: number;
};

type MagicArenaFigureTransition =
  | {
      type: "rescue";
      figure: MagicArenaFigureState;
      fromCoord: MagicArenaCoord;
      toCoord: MagicArenaCoord;
    }
  | {
      type: "eliminated";
      figure: MagicArenaFigureSnapshot;
      fromCoord: MagicArenaCoord;
    };

function axialToWorld(coord: MagicArenaCoord): THREE.Vector3 {
  return new THREE.Vector3(
    hexSize * Math.sqrt(3) * (coord.q + coord.r / 2),
    0,
    hexSize * 1.5 * coord.r
  );
}

function axialKey(coord: MagicArenaCoord): string {
  return `${coord.q},${coord.r}`;
}

function parseColor(color: string, fallback = "#38bdf8"): THREE.Color {
  try {
    return new THREE.Color(color);
  } catch {
    return new THREE.Color(fallback);
  }
}

function fieldColor(type: string, hp: number, maxHp: number): string {
  const ratio = Math.max(0, Math.min(1, hp / Math.max(1, maxHp)));

  if (type === "strong") {
    return ratio < 0.45 ? "#64748b" : "#94a3b8";
  }

  if (type === "weak") {
    return ratio < 0.45 ? "#a16207" : "#facc15";
  }

  return ratio < 0.45 ? "#0f766e" : "#2dd4bf";
}

function createMaterial(color: string, opacity = 1): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.58,
    metalness: 0.06,
    transparent: opacity < 1,
    opacity
  });
}

function createGlowMaterial(color: string, opacity = 1): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
}

function setObjectOpacity(object: THREE.Object3D, opacity: number): void {
  object.traverse((child) => {
    const material = (child as THREE.Mesh).material;

    if (Array.isArray(material)) {
      for (const entry of material) {
        entry.transparent = true;
        entry.opacity = opacity;
      }
    } else if (material) {
      material.transparent = true;
      material.opacity = opacity;
    }
  });
}

function disposeObject(object: THREE.Object3D): void {
  object.traverse((child) => {
    const mesh = child as THREE.Mesh;

    if (mesh.geometry) {
      mesh.geometry.dispose();
    }

    const material = mesh.material;

    if (Array.isArray(material)) {
      for (const entry of material) {
        entry.dispose();
      }
    } else if (material) {
      material.dispose();
    }
  });
}

function createTextSprite(text: string, color = "#f8fafc", background = "rgba(2,6,23,0.64)"): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = 160;
  canvas.height = 72;
  const context = canvas.getContext("2d");

  if (context) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = background;
    context.strokeStyle = "rgba(255,255,255,0.28)";
    context.lineWidth = 3;
    context.beginPath();
    context.roundRect(14, 12, 132, 48, 12);
    context.fill();
    context.stroke();
    context.fillStyle = color;
    context.font = "900 27px Inter, system-ui, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text, canvas.width / 2, canvas.height / 2 + 1);
  }

  const texture = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      depthTest: false
    })
  );
  sprite.renderOrder = 1000;
  sprite.scale.set(0.82, 0.37, 1);
  return sprite;
}

function createHpBarSprite(current: number, max: number, color: string): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = 180;
  canvas.height = 42;
  const context = canvas.getContext("2d");
  const ratio = Math.max(0, Math.min(1, current / Math.max(1, max)));

  if (context) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "rgba(2,6,23,0.72)";
    context.beginPath();
    context.roundRect(16, 13, 148, 16, 8);
    context.fill();
    context.fillStyle = color;
    context.beginPath();
    context.roundRect(18, 15, Math.max(4, 144 * ratio), 12, 6);
    context.fill();
    context.strokeStyle = "rgba(248,250,252,0.5)";
    context.lineWidth = 2;
    context.beginPath();
    context.roundRect(16, 13, 148, 16, 8);
    context.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      depthTest: false
    })
  );
  sprite.renderOrder = 1000;
  sprite.scale.set(0.58, 0.14, 1);
  return sprite;
}

export class MagicArenaHostScene extends Phaser.Scene {
  private unsubscribe?: () => void;
  private root?: HTMLDivElement;
  private overlay?: HTMLDivElement;
  private threeRenderer?: THREE.WebGLRenderer;
  private scene3d?: THREE.Scene;
  private camera?: THREE.PerspectiveCamera;
  private boardGroup?: THREE.Group;
  private animationId: number | null = null;
  private latestState: MagicArenaPublicState | null = null;
  private figureSnapshots = new Map<string, MagicArenaFigureSnapshot>();
  private activeActionKey: string | null = null;
  private activeActionEffectStartAt = 0;
  private currentEffectStartAt = 0;
  private currentEffectDurationMs = actionEffectMs;
  private debugOverlayVisible = false;
  private debugKeyHandler?: (event: KeyboardEvent) => void;
  private lastWidth = 0;
  private lastHeight = 0;

  constructor() {
    super(magicArenaManifest.hostView);
  }

  create(): void {
    const client = this.registry.get("hostClient") as HostClientLike;

    this.cameras.main.setBackgroundColor("#06111f");
    this.createSurface();
    this.createScene();
    this.debugKeyHandler = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "d" || event.repeat) {
        return;
      }

      this.debugOverlayVisible = !this.debugOverlayVisible;
      this.updateOverlay();
    };
    window.addEventListener("keydown", this.debugKeyHandler);
    this.unsubscribe = client.subscribe((appState) => {
      this.latestState = (appState.game?.state ?? null) as MagicArenaPublicState | null;
      this.rebuildBoard();
      this.updateOverlay();
    });
    this.startLoop();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroySurface());
  }

  private createSurface(): void {
    const parent = document.getElementById("app");

    if (!parent) {
      throw new Error("Host app root missing.");
    }

    parent.style.position = "relative";
    const root = document.createElement("div");
    Object.assign(root.style, {
      position: "absolute",
      inset: "0",
      overflow: "hidden",
      background: "#06111f",
      pointerEvents: "none",
      zIndex: "1"
    } satisfies Partial<CSSStyleDeclaration>);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x06111f, 1);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    root.appendChild(renderer.domElement);

    const overlay = document.createElement("div");
    Object.assign(overlay.style, {
      position: "absolute",
      inset: "16px",
      display: "grid",
      gridTemplateColumns: "minmax(260px, 360px) 1fr minmax(260px, 360px)",
      alignItems: "start",
      gap: "14px",
      fontFamily: "Inter, system-ui, sans-serif",
      color: "#e2e8f0",
      pointerEvents: "none"
    } satisfies Partial<CSSStyleDeclaration>);
    root.appendChild(overlay);
    const style = document.createElement("style");
    style.textContent = `
      @keyframes magicArenaResultReveal {
        from { opacity: 0; transform: translateY(-4px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    root.appendChild(style);
    parent.appendChild(root);

    this.root = root;
    this.overlay = overlay;
    this.threeRenderer = renderer;
  }

  private createScene(): void {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#06111f");
    scene.fog = new THREE.Fog("#06111f", 7, 18);

    const camera = new THREE.PerspectiveCamera(48, 16 / 9, 0.1, 100);
    camera.position.set(0, 7.6, 7.8);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.HemisphereLight("#dbeafe", "#123145", 1.25));
    const key = new THREE.DirectionalLight("#ffffff", 2.2);
    key.position.set(2, 8, 5);
    scene.add(key);

    const water = new THREE.Mesh(
      new THREE.CircleGeometry(7.2, 96),
      new THREE.MeshStandardMaterial({
        color: "#0369a1",
        emissive: "#075985",
        roughness: 0.35,
        metalness: 0,
        transparent: true,
        opacity: 0.78
      })
    );
    water.rotation.x = -Math.PI / 2;
    water.position.y = -0.08;
    scene.add(water);

    const boardGroup = new THREE.Group();
    scene.add(boardGroup);

    this.scene3d = scene;
    this.camera = camera;
    this.boardGroup = boardGroup;
  }

  private startLoop(): void {
    const render = () => {
      this.animationId = window.requestAnimationFrame(render);
      this.renderThree();
    };

    render();
  }

  private ensureRendererSize(): { width: number; height: number } {
    const root = this.root;
    const renderer = this.threeRenderer;

    if (!root || !renderer) {
      return { width: 0, height: 0 };
    }

    const width = Math.max(1, root.clientWidth);
    const height = Math.max(1, root.clientHeight);

    if (width !== this.lastWidth || height !== this.lastHeight) {
      renderer.setSize(width, height, false);
      this.lastWidth = width;
      this.lastHeight = height;
      if (this.camera) {
        this.camera.aspect = width / height;
        this.camera.position.set(0, width < 900 ? 8.8 : 7.6, width < 900 ? 8.6 : 7.8);
        this.camera.lookAt(0, 0, 0);
        this.camera.updateProjectionMatrix();
      }
    }

    return { width, height };
  }

  private renderThree(): void {
    const renderer = this.threeRenderer;
    const scene = this.scene3d;
    const camera = this.camera;

    if (!renderer || !scene || !camera) {
      return;
    }

    const { width, height } = this.ensureRendererSize();

    if (width <= 0 || height <= 0) {
      return;
    }

    if (this.boardGroup) {
      this.boardGroup.rotation.y = Math.sin(Date.now() / 3600) * 0.025;
      this.updateActionEffects();
    }

    renderer.render(scene, camera);
  }

  private getActiveActionKey(active: MagicArenaActiveActionState | undefined): string | null {
    if (!active) {
      return null;
    }

    return [
      active.kind,
      active.roundIndex,
      active.slotIndex ?? "none",
      active.playerId ?? "system",
      active.figureId ?? "none",
      active.actionId ?? active.roundEventId ?? "none",
      active.targetCoord ? axialKey(active.targetCoord) : "none",
      active.at
    ].join("|");
  }

  private getActionTimingProfile(active: MagicArenaActiveActionState | undefined): MagicArenaActionTimingProfile {
    if (!active) {
      return { textLeadMs: actionTextLeadMs, defaultDurationMs: actionEffectMs };
    }

    if (active.kind === "bombs") {
      return { textLeadMs: 380, defaultDurationMs: 1650 };
    }

    if (active.kind === "round_event") {
      return { textLeadMs: 400, defaultDurationMs: 1650 };
    }

    if (active.kind === "round_end") {
      return { textLeadMs: 0, defaultDurationMs: 1000 };
    }

    const movementSteps = Math.max(active.path?.length ?? 0, active.affectedCoords?.length ?? 0);

    switch (active.actionId) {
      case "move":
        return { textLeadMs: 170, defaultDurationMs: Math.min(1050, 820 + movementSteps * 90) };
      case "sprint":
        return { textLeadMs: 190, defaultDurationMs: Math.min(1150, 860 + movementSteps * 80) };
      case "charge_run":
        return { textLeadMs: 210, defaultDurationMs: 1050 };
      case "punch":
      case "hammer_blow":
        return { textLeadMs: 170, defaultDurationMs: 900 };
      case "dig":
        return { textLeadMs: 150, defaultDurationMs: 900 };
      case "earthquake":
        return { textLeadMs: 220, defaultDurationMs: 1400 };
      case "shockwave":
        return { textLeadMs: 210, defaultDurationMs: 1250 };
      case "bomb":
      case "pitfall":
      case "magic_mine":
        return { textLeadMs: 210, defaultDurationMs: 1050 };
      case "meteor_strike":
        return { textLeadMs: 420, defaultDurationMs: 1800 };
      case "lightning_strike":
      case "fireball":
      case "chain_lightning":
        return { textLeadMs: 340, defaultDurationMs: 1500 };
      case "rift":
      case "platform_break":
      case "time_rift":
        return { textLeadMs: 320, defaultDurationMs: 1400 };
      case "enemy_swap":
      case "stealth":
        return { textLeadMs: 300, defaultDurationMs: 1300 };
      case "teleport":
        return { textLeadMs: 210, defaultDurationMs: 980 };
      case "kraken":
      case "storm_cloud":
        return { textLeadMs: 340, defaultDurationMs: 1500 };
      default:
        return { textLeadMs: actionTextLeadMs, defaultDurationMs: actionEffectMs };
    }
  }

  private getActiveActionEffectStartAt(
    active: MagicArenaActiveActionState | undefined,
    timing = this.getActionTimingProfile(active)
  ): number {
    const key = this.getActiveActionKey(active);

    if (!key) {
      this.activeActionKey = null;
      this.activeActionEffectStartAt = 0;
      return performance.now();
    }

    if (key !== this.activeActionKey) {
      this.activeActionKey = key;
      this.activeActionEffectStartAt = performance.now() + timing.textLeadMs;
    }

    return this.activeActionEffectStartAt;
  }

  private getEffectCreatedAt(offsetMs = 0): number {
    return (this.currentEffectStartAt || performance.now()) + offsetMs;
  }

  private createEffect<T extends MagicArenaEffect>(effect: T, durationMs = this.currentEffectDurationMs): T {
    return { ...effect, durationMs } as T;
  }

  private updateActionEffects(): void {
    const group = this.boardGroup;

    if (!group) {
      return;
    }

    const now = performance.now();

    group.traverse((object) => {
      const effect = object.userData.magicArenaEffect as MagicArenaEffect | undefined;

      if (!effect) {
        return;
      }

      const rawAgeMs = now - effect.createdAt;

      if (rawAgeMs < 0) {
        if (effect.mode !== "hopPath" && effect.mode !== "digHop") {
          setObjectOpacity(object, 0);
        }

        return;
      }

      const durationMs = effect.durationMs ?? actionEffectMs;
      const age = rawAgeMs / Math.max(1, durationMs);
      const progress = Math.min(1, age);
      const loopProgress = age % 1;

      if (effect.mode === "pulse") {
        const scale = effect.baseScale + Math.sin(loopProgress * Math.PI) * 0.24;
        object.scale.setScalar(scale);

        const mesh = object as THREE.Mesh;
        const material = mesh.material;

        if (material instanceof THREE.MeshStandardMaterial) {
          material.opacity = 0.34 + Math.sin(loopProgress * Math.PI) * 0.36;
        }
      } else if (effect.mode === "bob") {
        object.position.y = effect.baseY + Math.sin(loopProgress * Math.PI * 2) * 0.045;
        object.rotation.y += 0.02;
        setObjectOpacity(object, 0.86);
      } else if (effect.mode === "burst") {
        const wave = Math.sin(progress * Math.PI);
        object.scale.setScalar(effect.baseScale + progress * 1.35);
        object.rotation.y += effect.spin ?? 0.025;
        setObjectOpacity(object, Math.max(0, wave * 0.9));
      } else if (effect.mode === "digHop") {
        const hop = Math.sin(progress * Math.PI);
        object.position.y = effect.baseY + hop * 0.42;
        object.scale.set(effect.baseScale + hop * 0.08, effect.baseScale + hop * 0.14, effect.baseScale + hop * 0.08);
      } else if (effect.mode === "ascend") {
        object.position.y = effect.baseY + progress * 1.2 + Math.sin(progress * Math.PI) * 0.1;
        object.rotation.y += effect.spin ?? 0.025;
        object.scale.setScalar(effect.baseScale + progress * 0.25);
        setObjectOpacity(object, Math.max(0, 0.96 - progress * 0.82));
      } else if (effect.mode === "strike") {
        const flicker = 0.55 + Math.abs(Math.sin(age * Math.PI * 15)) * 0.45;
        object.scale.setScalar(effect.baseScale + Math.sin(progress * Math.PI) * 0.18);
        setObjectOpacity(object, Math.max(0.2, flicker * (1 - progress * 0.45)));
      } else if (effect.mode === "projectile") {
        const travel = Math.min(1, progress * 1.3);
        object.position.copy(effect.start).lerp(effect.end, travel);
        object.rotation.y += effect.spin ?? 0.04;
        object.scale.setScalar(0.72 + Math.sin(travel * Math.PI) * 0.42);
        setObjectOpacity(object, Math.max(0.15, 1 - Math.max(0, progress - 0.72) * 2.4));
      } else if (effect.mode === "quake") {
        object.position.y = effect.baseY + Math.sin(age * Math.PI * 18) * 0.035 * (1 - progress);
        object.scale.setScalar(effect.baseScale + progress * 1.1);
        setObjectOpacity(object, Math.max(0, 0.92 - progress * 0.72));
      } else if (effect.mode === "hopPath") {
        const points = effect.points;

        if (points.length > 0) {
          const segmentCount = Math.max(1, points.length - 1);
          const travel = Math.min(0.999, progress * 1.18);
          const segmentIndex = Math.min(segmentCount - 1, Math.floor(travel * segmentCount));
          const localT = travel * segmentCount - segmentIndex;
          const start = points[segmentIndex] ?? points[0];
          const end = points[segmentIndex + 1] ?? start;

          object.position.copy(start).lerp(end, localT);
          object.position.y += Math.sin(localT * Math.PI) * 0.34;
        }

        object.rotation.y += effect.spin ?? 0.06;
        object.scale.setScalar(effect.baseScale + Math.sin(progress * Math.PI) * 0.18);
      } else if (effect.mode === "rune") {
        object.position.y = effect.baseY + Math.sin(loopProgress * Math.PI * 2) * 0.035;
        object.rotation.y += 0.035;
        object.scale.setScalar(effect.baseScale + Math.sin(loopProgress * Math.PI) * 0.18);
        setObjectOpacity(object, 0.62 + Math.sin(loopProgress * Math.PI) * 0.3);
      }
    });
  }

  private getFigureRootWorld(
    state: MagicArenaPublicState,
    coord: MagicArenaCoord,
    status: MagicArenaFigureState["status"],
    fieldHeights: Map<string, number>
  ): THREE.Vector3 {
    const world = axialToWorld(coord);
    const field = state.board.fieldsByCoord[axialKey(coord)];

    world.y = status === "in_water" || field?.exists === false
      ? 0.08
      : (fieldHeights.get(axialKey(coord)) ?? 0.18) + 0.22;

    return world;
  }

  private getActiveMotionCoords(
    state: MagicArenaPublicState,
    figure: MagicArenaFigureState,
    finalCoord: MagicArenaCoord
  ): MagicArenaCoord[] | null {
    const active = state.activeAction;

    if (
      active?.kind !== "action" ||
      active.figureId !== figure.figureId ||
      !active.originCoord ||
      (active.actionId !== "move" && active.actionId !== "sprint" && active.actionId !== "charge_run")
    ) {
      return null;
    }

    const actionCoords = active.actionId === "charge_run"
      ? active.affectedCoords ?? []
      : active.path?.length
        ? active.path
        : active.affectedCoords ?? [];
    const coords = [active.originCoord, ...actionCoords].filter(
      (coord, index, allCoords) => index === 0 || !sameCoord(coord, allCoords[index - 1])
    );

    const finalIndex = coords.findIndex((coord) => sameCoord(coord, finalCoord));
    if (finalIndex === 0) {
      return null;
    }

    const clippedCoords = finalIndex > 0 ? coords.slice(0, finalIndex + 1) : coords;
    const lastCoord = clippedCoords[clippedCoords.length - 1];

    if (!lastCoord || !sameCoord(lastCoord, finalCoord)) {
      clippedCoords.push(finalCoord);
    }

    return clippedCoords.length > 1 ? clippedCoords : null;
  }

  private createFigureSnapshot(figure: MagicArenaFigureState): MagicArenaFigureSnapshot {
    return {
      figureId: figure.figureId,
      playerId: figure.playerId,
      name: figure.name,
      status: figure.status,
      coord: figure.coord ? { ...figure.coord } : undefined,
      waterCoord: figure.waterCoord ? { ...figure.waterCoord } : undefined,
      hp: figure.hp,
      maxHp: figure.maxHp,
      rescueDeadlineRound: figure.rescueDeadlineRound
    };
  }

  private collectFigureTransitions(state: MagicArenaPublicState): MagicArenaFigureTransition[] {
    const nextSnapshots = new Map<string, MagicArenaFigureSnapshot>();
    const transitions: MagicArenaFigureTransition[] = [];

    for (const player of state.players) {
      for (const figure of player.figures) {
        const current = this.createFigureSnapshot(figure);
        const previous = this.figureSnapshots.get(figure.figureId);
        nextSnapshots.set(figure.figureId, current);

        if (!previous) {
          continue;
        }

        if (previous.status === "in_water" && figure.status === "alive" && previous.waterCoord && figure.coord) {
          transitions.push({
            type: "rescue",
            figure,
            fromCoord: { ...previous.waterCoord },
            toCoord: { ...figure.coord }
          });
        }

        if (previous.status !== "eliminated" && figure.status === "eliminated") {
          const fromCoord = previous.coord ?? previous.waterCoord;

          if (fromCoord) {
            transitions.push({
              type: "eliminated",
              figure: previous,
              fromCoord: { ...fromCoord }
            });
          }
        }
      }
    }

    if (this.figureSnapshots.size === 0) {
      this.figureSnapshots = nextSnapshots;
      return [];
    }

    this.figureSnapshots = nextSnapshots;
    return transitions;
  }

  private rebuildBoard(): void {
    const state = this.latestState;
    const group = this.boardGroup;

    if (!state || !group) {
      return;
    }

    for (const child of [...group.children]) {
      group.remove(child);
      disposeObject(child);
    }

    const fieldHeights = new Map<string, number>();

    for (const field of Object.values(state.board.fieldsByCoord)) {
      const world = axialToWorld(field.coord);

      if (!field.exists) {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(hexSize * 0.72, 0.025, 8, 6),
          createMaterial("#38bdf8", 0.44)
        );
        ring.position.set(world.x, 0.02, world.z);
        ring.rotation.x = Math.PI / 2;
        group.add(ring);
        continue;
      }

      const fullHeight = 0.24 + (field.maxHp / maxFieldHp) * 0.36;
      const height = 0.12 + (field.hp / Math.max(1, field.maxHp)) * (fullHeight - 0.12);
      fieldHeights.set(axialKey(field.coord), height);
      const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(hexSize, hexSize, height, 6),
        createMaterial(fieldColor(field.type, field.hp, field.maxHp))
      );
      mesh.position.set(world.x, height / 2, world.z);
      group.add(mesh);

      if (field.specialType && field.specialType !== "explosive") {
        this.addSpecialFieldVisual(group, field.specialType, field.coord, height);
      }
    }

    const playersById = new Map(state.players.map((player, index) => [player.playerId, { player, index }] as const));
    const activeTiming = this.getActionTimingProfile(state.activeAction);
    const activeEffectStartAt = this.getActiveActionEffectStartAt(state.activeAction, activeTiming);
    const figureTransitions = this.collectFigureTransitions(state);
    const rescueMotionByFigureId = new Map<string, THREE.Vector3[]>();

    for (const transition of figureTransitions) {
      if (transition.type !== "rescue") {
        continue;
      }

      rescueMotionByFigureId.set(transition.figure.figureId, [
        this.getEffectWorld(transition.fromCoord, fieldHeights, 0.14),
        this.getEffectWorld(transition.toCoord, fieldHeights, 0.42)
      ]);
    }

    this.currentEffectStartAt = activeEffectStartAt;
    this.currentEffectDurationMs = activeTiming.defaultDurationMs;
    for (const player of state.players) {
      for (const figure of player.figures) {
        if (figure.status === "eliminated") {
          continue;
        }

        const coord = figure.status === "alive" ? figure.coord : figure.waterCoord;

        if (!coord) {
          continue;
        }

        const color = playersById.get(figure.playerId)?.player.color ?? playerFallbackColors[playersById.get(figure.playerId)?.index ?? 0];
        const motionCoords = this.getActiveMotionCoords(state, figure, coord);
        const visualCoord = motionCoords?.[0] ?? coord;
        let motionMode: "path" | "dig" = "path";
        let motionPoints = rescueMotionByFigureId.get(figure.figureId) ??
          motionCoords?.map((motionCoord) => this.getFigureRootWorld(state, motionCoord, figure.status, fieldHeights));

        if (!motionPoints && state.activeAction?.kind === "action" && state.activeAction.figureId === figure.figureId && state.activeAction.actionId === "dig") {
          const base = this.getFigureRootWorld(state, coord, figure.status, fieldHeights);
          motionPoints = [
            base,
            base.clone().add(new THREE.Vector3(0, 0.42, 0)),
            base.clone()
          ];
          motionMode = "dig";
        }

        this.addFigureVisual(
          group,
          figure,
          visualCoord,
          color,
          fieldHeights.get(axialKey(visualCoord)) ?? 0.18,
          motionPoints,
          motionMode
        );
      }
    }
    this.currentEffectStartAt = 0;
    this.currentEffectDurationMs = actionEffectMs;

    for (const bomb of state.pendingBombs) {
      this.addBombVisual(group, bomb.coord, fieldHeights.get(axialKey(bomb.coord)) ?? 0.16);
    }

    for (const object of state.boardObjects ?? []) {
      if (object.type === "bomb") {
        continue;
      }

      this.addBoardObjectVisual(group, object.type, object.coord, fieldHeights.get(axialKey(object.coord)) ?? 0.16);
    }

    this.addRoundEventMarkers(group, state, fieldHeights);
    this.addActiveActionVisual(group, state, fieldHeights);
    this.currentEffectStartAt = activeEffectStartAt;
    this.currentEffectDurationMs = activeTiming.defaultDurationMs;
    this.addFigureTransitionVisuals(group, figureTransitions, playersById, fieldHeights);
    this.currentEffectStartAt = 0;
    this.currentEffectDurationMs = actionEffectMs;
  }

  private addSpecialFieldVisual(group: THREE.Group, type: string, coord: MagicArenaCoord, fieldHeight: number): void {
    const world = axialToWorld(coord);
    const root = new THREE.Group();
    root.position.set(world.x, fieldHeight + 0.045, world.z);

    if (type === "crystal") {
      const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.13), createGlowMaterial("#67e8f9", 0.86));
      crystal.position.y = 0.15;
      root.userData.magicArenaEffect = { mode: "bob", createdAt: performance.now(), baseY: root.position.y };
      root.add(crystal);
    } else if (type === "explosive") {
      const warning = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.2, 3), createMaterial("#ef4444", 0.9));
      warning.rotation.y = Math.PI / 6;
      warning.position.y = 0.1;
      root.add(warning);
    } else if (type === "cracked") {
      const fissures = [
        [
          new THREE.Vector3(-0.28, 0.028, -0.12),
          new THREE.Vector3(-0.12, 0.034, -0.02),
          new THREE.Vector3(0.02, 0.032, -0.08),
          new THREE.Vector3(0.24, 0.036, 0.1)
        ],
        [
          new THREE.Vector3(-0.04, 0.04, -0.06),
          new THREE.Vector3(-0.18, 0.037, 0.12),
          new THREE.Vector3(-0.32, 0.034, 0.18)
        ],
        [
          new THREE.Vector3(0.06, 0.04, -0.03),
          new THREE.Vector3(0.18, 0.038, -0.2),
          new THREE.Vector3(0.34, 0.036, -0.25)
        ]
      ];

      for (const points of fissures) {
        const crack = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(points),
          new THREE.LineBasicMaterial({
            color: "#020617",
            transparent: true,
            opacity: 0.95,
            depthWrite: false
          })
        );
        crack.rotation.y = (coord.q * 0.55 + coord.r * 0.8) % Math.PI;
        root.add(crack);
      }

      const glow = new THREE.Mesh(
        new THREE.TorusGeometry(0.18, 0.008, 6, 24),
        createGlowMaterial("#f97316", 0.22)
      );
      glow.rotation.x = Math.PI / 2;
      glow.position.y = 0.026;
      root.add(glow);
    }

    group.add(root);
  }

  private addRoundEventMarkers(
    group: THREE.Group,
    state: MagicArenaPublicState,
    fieldHeights: Map<string, number>
  ): void {
    const event = state.currentRoundEvent;

    if (!event) {
      return;
    }

    const color = event.eventId === "flood_wave"
      ? "#38bdf8"
      : event.eventId === "earthquake_warning"
        ? "#f97316"
        : event.eventId === "unstable_arena"
          ? "#facc15"
          : event.eventId === "arcane_overload"
            ? "#c084fc"
            : event.eventId === "thin_floor"
              ? "#fb7185"
              : "#34d399";

    for (const [index, coord] of event.markedCoords.entries()) {
      this.addActionRingVisual(group, coord, color, fieldHeights.get(axialKey(coord)) ?? 0.12, index * 0.025);
    }
  }

  private addStormCloudModel(root: THREE.Group, scale = 1): void {
    const puffMaterial = createMaterial("#64748b", 0.9);
    const highlightMaterial = createMaterial("#94a3b8", 0.82);
    const shadowMaterial = createGlowMaterial("#0f172a", 0.18);
    const puffs = [
      { radius: 0.18, x: 0, y: 0, z: 0, material: puffMaterial },
      { radius: 0.14, x: -0.16, y: -0.01, z: 0.02, material: puffMaterial },
      { radius: 0.15, x: 0.17, y: -0.01, z: -0.01, material: puffMaterial },
      { radius: 0.12, x: -0.04, y: 0.11, z: 0.03, material: highlightMaterial },
      { radius: 0.11, x: 0.08, y: 0.08, z: 0.12, material: highlightMaterial }
    ];

    for (const puff of puffs) {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(puff.radius * scale, 18, 12), puff.material);
      mesh.position.set(puff.x * scale, puff.y * scale, puff.z * scale);
      root.add(mesh);
    }

    const underGlow = new THREE.Mesh(new THREE.TorusGeometry(0.28 * scale, 0.018 * scale, 8, 36), shadowMaterial);
    underGlow.rotation.x = Math.PI / 2;
    underGlow.position.y = -0.16 * scale;

    const bolt = new THREE.Mesh(new THREE.ConeGeometry(0.07 * scale, 0.3 * scale, 3), createGlowMaterial("#fde047", 0.9));
    bolt.position.set(0.04 * scale, -0.32 * scale, 0.01 * scale);
    bolt.rotation.z = Math.PI;
    bolt.rotation.y = 0.22;

    root.add(underGlow, bolt);
  }

  private addBoardObjectVisual(group: THREE.Group, type: string, coord: MagicArenaCoord, fieldHeight: number): void {
    const world = axialToWorld(coord);
    const root = new THREE.Group();
    const objectHeight = type === "storm_cloud_marker" ? fieldHeight + 0.82 : fieldHeight + 0.22;
    root.position.set(world.x, objectHeight, world.z);
    root.userData.magicArenaEffect = { mode: "bob", createdAt: performance.now(), baseY: root.position.y };

    if (type === "magic_mine") {
      const mine = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 10), createMaterial("#dc2626", 0.9));
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.012, 8, 24), createGlowMaterial("#facc15", 0.62));
      ring.rotation.x = Math.PI / 2;
      ring.position.y = -0.08;
      root.add(mine, ring);
    } else if (type === "time_rift_marker") {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.018, 8, 36), createGlowMaterial("#a78bfa", 0.74));
      ring.rotation.x = Math.PI / 2;
      const shard = new THREE.Mesh(new THREE.OctahedronGeometry(0.09), createGlowMaterial("#f8fafc", 0.78));
      shard.position.y = 0.18;
      root.add(ring, shard);
    } else if (type === "storm_cloud_marker") {
      this.addStormCloudModel(root, 1);
    }

    group.add(root);
  }

  private getFigureDisplayName(figure: MagicArenaFigureState): string {
    return figure.name.length > 14 ? `${figure.name.slice(0, 13)}.` : figure.name;
  }

  private addFigureVisual(
    group: THREE.Group,
    figure: MagicArenaFigureState,
    coord: MagicArenaCoord,
    color: string,
    fieldHeight: number,
    motionPoints?: THREE.Vector3[],
    motionMode: "path" | "dig" = "path"
  ): void {
    const world = axialToWorld(coord);
    const field = this.latestState?.board.fieldsByCoord[axialKey(coord)];
    const y = figure.status === "in_water" ? 0.08 : fieldHeight + 0.22;
    const root = new THREE.Group();
    const motionStart = motionPoints?.[0];

    if (motionStart) {
      root.position.copy(motionStart);
    } else {
      root.position.set(world.x, y, world.z);
    }

    if (motionPoints && motionPoints.length > 1) {
      root.userData.magicArenaEffect = motionMode === "dig"
        ? this.createEffect({ mode: "digHop", createdAt: this.getEffectCreatedAt(), baseScale: 1, baseY: root.position.y } satisfies MagicArenaEffect)
        : this.createEffect({ mode: "hopPath", createdAt: this.getEffectCreatedAt(), points: motionPoints, baseScale: 1, spin: 0 } satisfies MagicArenaEffect);
    }

    const opacity = figure.stealthUntilRound !== undefined ? 0.48 : 0.96;
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.13, figure.status === "in_water" ? 0.08 : 0.28, 6, 12),
      createMaterial(color, opacity)
    );
    body.position.y = figure.status === "in_water" ? 0.05 : 0.18;
    root.add(body);

    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.19, 0.018, 8, 32),
      createMaterial(figure.status === "in_water" ? "#7dd3fc" : "#f8fafc", figure.status === "in_water" ? 0.74 : 0.32)
    );
    halo.rotation.x = Math.PI / 2;
    halo.position.y = 0.02;
    root.add(halo);

    const hpBar = createHpBarSprite(figure.hp, figure.maxHp, color);
    hpBar.position.y = figure.status === "in_water" ? 0.34 : 0.56;
    root.add(hpBar);

    const name = createTextSprite(this.getFigureDisplayName(figure), "#f8fafc", "rgba(15,23,42,0.68)");
    name.position.y = figure.status === "in_water" ? 0.52 : 0.76;
    name.scale.set(0.56, 0.21, 1);
    root.add(name);

    if (figure.status === "in_water") {
      const deadline = createTextSprite(`bis R${figure.rescueDeadlineRound ?? "?"}`, "#bae6fd", "rgba(7,89,133,0.72)");
      deadline.position.y = 0.72;
      deadline.scale.set(0.46, 0.18, 1);
      root.add(deadline);
    }

    if (field?.exists === false && !motionStart) {
      root.position.y = 0.08;
    }

    group.add(root);
  }

  private addFigureTransitionVisuals(
    group: THREE.Group,
    transitions: MagicArenaFigureTransition[],
    playersById: Map<string, { player: MagicArenaPublicState["players"][number]; index: number }>,
    fieldHeights: Map<string, number>
  ): void {
    for (const transition of transitions) {
      const playerColor =
        playersById.get(transition.type === "rescue" ? transition.figure.playerId : transition.figure.playerId)?.player.color ??
        "#f8fafc";

      if (transition.type === "rescue") {
        this.addRescueVisual(group, transition.fromCoord, transition.toCoord, playerColor, fieldHeights);
      } else {
        this.addEliminationAngelVisual(group, transition.figure, transition.fromCoord, playerColor, fieldHeights);
      }
    }
  }

  private addRescueVisual(
    group: THREE.Group,
    fromCoord: MagicArenaCoord,
    toCoord: MagicArenaCoord,
    color: string,
    fieldHeights: Map<string, number>
  ): void {
    const start = this.getEffectWorld(fromCoord, fieldHeights, 0.12);
    const end = this.getEffectWorld(toCoord, fieldHeights, 0.55);
    const lift = start.clone().add(new THREE.Vector3(0, 0.42, 0));

    this.addWorldBeamVisual(group, lift, end, "#bae6fd", 0.035, 0.36);
    this.addBurstCore(group, start, "#e0f2fe", "#38bdf8", 0.13, 0.62);
    this.addBurstCore(group, end, "#f0fdf4", color, 0.14, 0.66);
    this.addActionRingVisual(group, fromCoord, "#7dd3fc", fieldHeights.get(axialKey(fromCoord)) ?? 0.12, 0);
    this.addActionRingVisual(group, toCoord, "#bbf7d0", fieldHeights.get(axialKey(toCoord)) ?? 0.12, 0.08);
  }

  private addEliminationAngelVisual(
    group: THREE.Group,
    figure: MagicArenaFigureSnapshot,
    fromCoord: MagicArenaCoord,
    color: string,
    fieldHeights: Map<string, number>
  ): void {
    const base = this.getEffectWorld(fromCoord, fieldHeights, figure.status === "in_water" ? 0.2 : 0.46);
    const root = new THREE.Group();
    root.position.copy(base);
    root.userData.magicArenaEffect = this.createEffect({ mode: "ascend", createdAt: this.getEffectCreatedAt(520), baseScale: 1, baseY: base.y, spin: 0.018 } satisfies MagicArenaEffect);

    const spirit = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.22, 5, 12), createGlowMaterial("#f8fafc", 0.86));
    spirit.position.y = 0.18;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 10), createGlowMaterial("#fefce8", 0.9));
    head.position.y = 0.38;
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.012, 8, 32), createGlowMaterial("#fde68a", 0.78));
    halo.position.y = 0.52;
    halo.rotation.x = Math.PI / 2;

    const leftWing = new THREE.Mesh(new THREE.CircleGeometry(0.15, 16, 0, Math.PI), createGlowMaterial("#e0f2fe", 0.42));
    leftWing.position.set(-0.13, 0.28, 0);
    leftWing.rotation.set(0.2, 0.2, Math.PI / 2);
    const rightWing = new THREE.Mesh(new THREE.CircleGeometry(0.15, 16, 0, Math.PI), createGlowMaterial("#e0f2fe", 0.42));
    rightWing.position.set(0.13, 0.28, 0);
    rightWing.rotation.set(0.2, -0.2, -Math.PI / 2);

    const glimmer = new THREE.Mesh(new THREE.SphereGeometry(0.2, 18, 12), createGlowMaterial(color, 0.14));
    glimmer.position.y = 0.26;
    root.add(spirit, head, halo, leftWing, rightWing, glimmer);
    group.add(root);

    this.addBurstCore(group, base, "#f8fafc", color, 0.12, 0.52);
  }

  private addBombVisual(group: THREE.Group, coord: MagicArenaCoord, fieldHeight: number): void {
    const world = axialToWorld(coord);
    const root = new THREE.Group();
    root.position.set(world.x, fieldHeight + 0.18, world.z);
    root.userData.magicArenaEffect = { mode: "bob", createdAt: performance.now(), baseY: root.position.y };

    const bomb = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), createMaterial("#020617"));
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.014, 8, 28), createMaterial("#0f172a", 0.78));
    rim.rotation.x = Math.PI / 2;
    rim.position.y = -0.1;
    root.add(bomb, rim);
    group.add(root);
  }

  private shouldShowCasterActivation(actionId: MagicArenaActiveActionState["actionId"] | undefined): boolean {
    switch (actionId) {
      case "lightning_strike":
      case "fireball":
      case "meteor_strike":
      case "chain_lightning":
      case "rift":
      case "platform_break":
      case "teleport":
      case "enemy_swap":
      case "stealth":
      case "kraken":
      case "time_rift":
      case "storm_cloud":
        return true;
      default:
        return false;
    }
  }

  private addActiveActionVisual(
    group: THREE.Group,
    state: MagicArenaPublicState,
    fieldHeights: Map<string, number>
  ): void {
    const active = state.activeAction;

    if (!active) {
      return;
    }

    const timing = this.getActionTimingProfile(active);
    this.currentEffectStartAt = this.getActiveActionEffectStartAt(active, timing);
    this.currentEffectDurationMs = timing.defaultDurationMs;

    const affectedCoords = active.affectedCoords?.length
      ? active.affectedCoords
      : active.targetCoord
        ? [active.targetCoord]
        : active.originCoord
          ? [active.originCoord]
          : [];

    if (active.kind === "bombs") {
      this.addBombExplosionEffect(group, active.targetCoord, affectedCoords, fieldHeights);
      return;
    }

    if (active.kind === "round_event") {
      this.addRoundEventActionVisual(group, active.roundEventId, affectedCoords, fieldHeights);
      return;
    }

    if (active.kind === "round_end") {
      return;
    }

    const playerColor = state.players.find((player) => player.playerId === active.playerId)?.color ?? "#38bdf8";
    const actionColor = this.getActionColor(active.actionId, playerColor);

    if (active.originCoord && this.shouldShowCasterActivation(active.actionId)) {
      this.addCasterActivationVisual(
        group,
        active.originCoord,
        actionColor,
        fieldHeights.get(axialKey(active.originCoord)) ?? 0.12
      );
    }

    switch (active.actionId) {
      case "move":
      case "sprint":
        this.addMovementHopEffect(group, active.originCoord, active.path ?? affectedCoords, actionColor, fieldHeights);
        return;
      case "charge_run":
        this.addDashRunEffect(group, active.originCoord, affectedCoords, actionColor, fieldHeights);
        return;
      case "punch":
        this.addMeleeStrikeEffect(group, active.originCoord, active.targetCoord ?? affectedCoords[0], "#facc15", fieldHeights);
        return;
      case "lightning_strike":
        this.addLightningStrikeEffect(group, active.targetCoord ?? affectedCoords[0], fieldHeights);
        return;
      case "fireball":
        this.addFireballEffect(group, active.originCoord, active.targetCoord ?? affectedCoords[0], fieldHeights);
        return;
      case "hammer_blow":
        this.addMeleeStrikeEffect(group, active.originCoord, active.targetCoord ?? affectedCoords[0], "#fb923c", fieldHeights);
        return;
      case "bomb":
        this.addBombPlacementEffect(group, active.originCoord, active.targetCoord ?? affectedCoords[0], fieldHeights);
        return;
      case "meteor_strike":
        this.addMeteorStrikeEffect(group, active.originCoord, active.targetCoord ?? affectedCoords[0], affectedCoords, fieldHeights);
        return;
      case "rift":
      case "platform_break":
        this.addTerrainCrackEffect(group, active.targetCoord ?? affectedCoords[0], "#fb7185", fieldHeights);
        return;
      case "earthquake":
        this.addEarthquakeEffect(group, active.originCoord, affectedCoords, fieldHeights);
        return;
      case "dig":
        this.addDigEffect(group, active.originCoord, fieldHeights);
        return;
      case "enemy_swap":
      case "teleport":
        this.addTeleportEffect(group, active.originCoord, active.targetCoord ?? affectedCoords[0], fieldHeights);
        return;
      case "stealth":
        this.addStealthEffect(group, active.originCoord, fieldHeights);
        return;
      case "shockwave":
        this.addShockwaveEffect(group, active.originCoord, affectedCoords, fieldHeights);
        return;
      case "chain_lightning":
        this.addChainLightningEffect(group, active.originCoord, active.targetCoord ?? affectedCoords[0], fieldHeights);
        return;
      case "pitfall":
        this.addTrapPlacementEffect(group, active.targetCoord ?? affectedCoords[0], "#a16207", fieldHeights);
        return;
      case "kraken":
        this.addKrakenEffect(group, active.originCoord, active.targetCoord ?? affectedCoords[0], fieldHeights);
        return;
      case "time_rift":
        this.addTimeRiftEffect(group, active.targetCoord ?? affectedCoords[0], fieldHeights);
        return;
      case "magic_mine":
        this.addMinePlacementEffect(group, active.targetCoord ?? affectedCoords[0], affectedCoords, fieldHeights);
        return;
      case "storm_cloud":
        this.addStormCloudEffect(group, active.targetCoord ?? affectedCoords[0], fieldHeights);
        return;
      default:
        break;
    }

    const color = active.actionId === "bomb" ? "#fb923c" : actionColor;

    affectedCoords.forEach((coord, index) => {
      this.addActionRingVisual(group, coord, color, fieldHeights.get(axialKey(coord)) ?? 0.12, index * 0.08);
    });

    if (active.path?.length) {
      active.path.forEach((coord, index) => {
        this.addPathStepVisual(group, coord, fieldHeights.get(axialKey(coord)) ?? 0.12, index + 1);
      });
    }

    if (active.originCoord && active.targetCoord && !sameCoord(active.originCoord, active.targetCoord)) {
      this.addActionBeamVisual(group, active.originCoord, active.targetCoord, color);
    }
  }

  private getActionColor(actionId: string | undefined, playerColor: string): string {
    switch (actionId) {
      case "move":
      case "sprint":
      case "teleport":
      case "enemy_swap":
        return "#38bdf8";
      case "punch":
      case "hammer_blow":
      case "shockwave":
      case "charge_run":
        return "#facc15";
      case "fireball":
      case "bomb":
      case "meteor_strike":
        return "#fb923c";
      case "lightning_strike":
      case "chain_lightning":
        return "#bae6fd";
      case "rift":
      case "platform_break":
      case "earthquake":
      case "time_rift":
        return "#c084fc";
      case "pitfall":
      case "magic_mine":
      case "dig":
        return "#a3e635";
      case "stealth":
        return "#94a3b8";
      case "kraken":
      case "storm_cloud":
        return "#22d3ee";
      default:
        return playerColor;
    }
  }

  private addCasterActivationVisual(group: THREE.Group, coord: MagicArenaCoord, color: string, fieldHeight: number): void {
    const world = axialToWorld(coord);
    const root = new THREE.Group();
    root.position.set(world.x, fieldHeight + 0.34, world.z);
    root.userData.magicArenaEffect = this.createEffect({ mode: "rune", createdAt: this.getEffectCreatedAt(), baseScale: 1, baseY: root.position.y } satisfies MagicArenaEffect);

    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.018, 8, 40), createGlowMaterial(color, 0.58));
    ring.rotation.x = Math.PI / 2;
    const spark = new THREE.Mesh(new THREE.OctahedronGeometry(0.08), createGlowMaterial("#f8fafc", 0.78));
    spark.position.y = 0.28;
    const aura = new THREE.Mesh(new THREE.SphereGeometry(0.22, 18, 12), createGlowMaterial(color, 0.18));
    aura.position.y = 0.14;
    root.add(ring, spark, aura);
    group.add(root);
  }

  private addMovementHopEffect(
    group: THREE.Group,
    originCoord: MagicArenaCoord | undefined,
    path: MagicArenaCoord[],
    color: string,
    fieldHeights: Map<string, number>
  ): void {
    if (!originCoord) {
      return;
    }

    const coords = [originCoord, ...path.filter((coord) => !sameCoord(coord, originCoord))];
    const finalCoord = coords[coords.length - 1];

    if (finalCoord && !sameCoord(finalCoord, originCoord)) {
      this.addActionRingVisual(group, finalCoord, color, fieldHeights.get(axialKey(finalCoord)) ?? 0.12, 0);
    }
  }

  private addDashRunEffect(
    group: THREE.Group,
    originCoord: MagicArenaCoord | undefined,
    affectedCoords: MagicArenaCoord[],
    color: string,
    fieldHeights: Map<string, number>
  ): void {
    if (!originCoord) {
      return;
    }

    const coords = [originCoord, ...affectedCoords.filter((coord) => !sameCoord(coord, originCoord))];
    const points = coords.map((coord) => this.getEffectWorld(coord, fieldHeights, 0.44));

    coords.slice(1).forEach((coord, index) => {
      this.addActionRingVisual(group, coord, color, fieldHeights.get(axialKey(coord)) ?? 0.12, index * 0.04);
    });

    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];

    if (!firstPoint || !lastPoint) {
      return;
    }

    if (points.length >= 2) {
      this.addWorldBeamVisual(group, firstPoint, lastPoint, color, 0.06, 0.36);
    }
  }

  private addMeleeStrikeEffect(
    group: THREE.Group,
    originCoord: MagicArenaCoord | undefined,
    targetCoord: MagicArenaCoord | undefined,
    color: string,
    fieldHeights: Map<string, number>
  ): void {
    const target = targetCoord ?? originCoord;

    if (!target) {
      return;
    }

    const impact = this.getEffectWorld(target, fieldHeights, 0.42);
    this.addBurstCore(group, impact, "#fef3c7", color, 0.16, 0.7);
    this.addActionRingVisual(group, target, color, fieldHeights.get(axialKey(target)) ?? 0.12, 0);

    if (originCoord && !sameCoord(originCoord, target)) {
      this.addActionBeamVisual(group, originCoord, target, color);
    }
  }

  private addBombPlacementEffect(
    group: THREE.Group,
    originCoord: MagicArenaCoord | undefined,
    targetCoord: MagicArenaCoord | undefined,
    fieldHeights: Map<string, number>
  ): void {
    if (!targetCoord) {
      return;
    }

    const target = this.getEffectWorld(targetCoord, fieldHeights, 0.28);
    const start = originCoord ? this.getEffectWorld(originCoord, fieldHeights, 0.9) : target.clone().add(new THREE.Vector3(-0.8, 0.9, -0.4));
    const bomb = new THREE.Group();
    bomb.position.copy(start);
    bomb.userData.magicArenaEffect = this.createEffect({ mode: "projectile", createdAt: this.getEffectCreatedAt(), start, end: target, spin: 0.12 } satisfies MagicArenaEffect);
    bomb.add(
      new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10), createMaterial("#020617", 0.98)),
      new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 10), createGlowMaterial("#facc15", 0.12))
    );
    group.add(bomb);
    this.addActionRingVisual(group, targetCoord, "#020617", fieldHeights.get(axialKey(targetCoord)) ?? 0.12, 0);
  }

  private addTerrainCrackEffect(
    group: THREE.Group,
    targetCoord: MagicArenaCoord | undefined,
    color: string,
    fieldHeights: Map<string, number>
  ): void {
    if (!targetCoord) {
      return;
    }

    const world = axialToWorld(targetCoord);
    const height = fieldHeights.get(axialKey(targetCoord)) ?? 0.12;
    this.addActionRingVisual(group, targetCoord, color, height, 0);
    const crack = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-0.3, 0, -0.14),
        new THREE.Vector3(-0.12, 0, 0.03),
        new THREE.Vector3(0.02, 0, -0.06),
        new THREE.Vector3(0.3, 0, 0.14)
      ]),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.96, depthWrite: false })
    );
    crack.position.set(world.x, height + 0.13, world.z);
    crack.rotation.y = (targetCoord.q * 0.8 + targetCoord.r * 1.2) % Math.PI;
    crack.userData.magicArenaEffect = this.createEffect({ mode: "quake", createdAt: this.getEffectCreatedAt(), baseScale: 1, baseY: crack.position.y } satisfies MagicArenaEffect);
    group.add(crack);
  }

  private addDigEffect(group: THREE.Group, originCoord: MagicArenaCoord | undefined, fieldHeights: Map<string, number>): void {
    if (!originCoord) {
      return;
    }

    const center = this.getEffectWorld(originCoord, fieldHeights, 0.25);
    const fieldHeight = fieldHeights.get(axialKey(originCoord)) ?? 0.12;
    this.addBurstCore(group, center, "#fde68a", "#92400e", 0.16, 0.65);
    this.addTerrainCrackEffect(group, originCoord, "#a16207", fieldHeights);
    this.addActionRingVisual(group, originCoord, "#92400e", fieldHeight, 0.02);

    for (let index = 0; index < 8; index += 1) {
      const angle = (Math.PI * 2 * index) / 8 + originCoord.q * 0.17 + originCoord.r * 0.11;
      const start = center.clone().add(new THREE.Vector3(Math.cos(angle) * 0.05, 0.02, Math.sin(angle) * 0.05));
      const end = center.clone().add(new THREE.Vector3(Math.cos(angle) * 0.42, 0.18 + (index % 3) * 0.05, Math.sin(angle) * 0.42));
      const chip = new THREE.Mesh(
        new THREE.BoxGeometry(0.055, 0.035, 0.045),
        createMaterial(index % 2 === 0 ? "#92400e" : "#facc15", 0.82)
      );
      chip.position.copy(start);
      chip.rotation.set(index * 0.4, angle, index * 0.2);
      chip.userData.magicArenaEffect = this.createEffect({ mode: "projectile", createdAt: this.getEffectCreatedAt(index * 32), start, end, spin: 0.18 } satisfies MagicArenaEffect);
      group.add(chip);
    }
  }

  private addTeleportEffect(
    group: THREE.Group,
    originCoord: MagicArenaCoord | undefined,
    targetCoord: MagicArenaCoord | undefined,
    fieldHeights: Map<string, number>
  ): void {
    if (!targetCoord) {
      return;
    }

    const target = this.getEffectWorld(targetCoord, fieldHeights, 0.46);
    this.addBurstCore(group, target, "#f8fafc", "#38bdf8", 0.16, 0.75);
    this.addActionRingVisual(group, targetCoord, "#38bdf8", fieldHeights.get(axialKey(targetCoord)) ?? 0.12, 0);

    if (originCoord) {
      const origin = this.getEffectWorld(originCoord, fieldHeights, 0.46);
      this.addBurstCore(group, origin, "#bae6fd", "#38bdf8", 0.13, 0.55);
      this.addWorldBeamVisual(group, origin, target, "#38bdf8", 0.035, 0.3);
    }
  }

  private addStealthEffect(group: THREE.Group, originCoord: MagicArenaCoord | undefined, fieldHeights: Map<string, number>): void {
    if (!originCoord) {
      return;
    }

    const center = this.getEffectWorld(originCoord, fieldHeights, 0.48);
    const veil = new THREE.Mesh(new THREE.SphereGeometry(0.34, 20, 12), createGlowMaterial("#cbd5e1", 0.28));
    veil.position.copy(center);
    veil.userData.magicArenaEffect = this.createEffect({ mode: "burst", createdAt: this.getEffectCreatedAt(), baseScale: 0.8, spin: 0.015 } satisfies MagicArenaEffect);
    group.add(veil);
  }

  private addShockwaveEffect(
    group: THREE.Group,
    originCoord: MagicArenaCoord | undefined,
    affectedCoords: MagicArenaCoord[],
    fieldHeights: Map<string, number>
  ): void {
    if (!originCoord) {
      return;
    }

    const origin = this.getEffectWorld(originCoord, fieldHeights, 0.3);
    this.addBurstCore(group, origin, "#fef3c7", "#facc15", 0.2, 0.9);
    [originCoord, ...affectedCoords].forEach((coord, index) => {
      this.addActionRingVisual(group, coord, "#facc15", fieldHeights.get(axialKey(coord)) ?? 0.12, index * 0.04);
    });
  }

  private addChainLightningEffect(
    group: THREE.Group,
    originCoord: MagicArenaCoord | undefined,
    targetCoord: MagicArenaCoord | undefined,
    fieldHeights: Map<string, number>
  ): void {
    if (!targetCoord) {
      return;
    }

    this.addLightningStrikeEffect(group, targetCoord, fieldHeights);

    if (originCoord) {
      const start = this.getEffectWorld(originCoord, fieldHeights, 0.72);
      const end = this.getEffectWorld(targetCoord, fieldHeights, 0.58);
      this.addWorldBeamVisual(group, start, end, "#7dd3fc", 0.03, 0.54);
    }
  }

  private addTrapPlacementEffect(
    group: THREE.Group,
    targetCoord: MagicArenaCoord | undefined,
    color: string,
    fieldHeights: Map<string, number>
  ): void {
    if (!targetCoord) {
      return;
    }

    const world = axialToWorld(targetCoord);
    const height = fieldHeights.get(axialKey(targetCoord)) ?? 0.12;
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.025, 20), createMaterial(color, 0.64));
    disc.position.set(world.x, height + 0.08, world.z);
    disc.userData.magicArenaEffect = this.createEffect({ mode: "pulse", createdAt: this.getEffectCreatedAt(), baseScale: 1 } satisfies MagicArenaEffect);
    group.add(disc);
  }

  private addKrakenEffect(
    group: THREE.Group,
    originCoord: MagicArenaCoord | undefined,
    targetCoord: MagicArenaCoord | undefined,
    fieldHeights: Map<string, number>
  ): void {
    if (!targetCoord) {
      return;
    }

    const target = this.getEffectWorld(targetCoord, fieldHeights, 0.24);
    this.addActionRingVisual(group, targetCoord, "#22d3ee", fieldHeights.get(axialKey(targetCoord)) ?? 0.12, 0);
    this.addBurstCore(group, target, "#7dd3fc", "#0e7490", 0.17, 0.75);

    for (let index = 0; index < 3; index += 1) {
      const tentacle = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-0.2 + index * 0.2, -0.18, -0.12),
          new THREE.Vector3(-0.12 + index * 0.12, 0.06, 0.05),
          new THREE.Vector3(0.05 + index * 0.05, 0.28, 0.12)
        ]),
        new THREE.LineBasicMaterial({ color: "#22d3ee", transparent: true, opacity: 0.82, depthWrite: false })
      );
      tentacle.position.copy(target);
      tentacle.rotation.y = index * 1.9;
      tentacle.userData.magicArenaEffect = this.createEffect({ mode: "strike", createdAt: this.getEffectCreatedAt(index * 80), baseScale: 1 } satisfies MagicArenaEffect);
      group.add(tentacle);
    }

    if (originCoord) {
      const origin = this.getEffectWorld(originCoord, fieldHeights, 0.62);
      this.addWorldBeamVisual(group, origin, target, "#22d3ee", 0.025, 0.28);
    }
  }

  private addTimeRiftEffect(group: THREE.Group, targetCoord: MagicArenaCoord | undefined, fieldHeights: Map<string, number>): void {
    if (!targetCoord) {
      return;
    }

    const center = this.getEffectWorld(targetCoord, fieldHeights, 0.5);
    this.addActionRingVisual(group, targetCoord, "#a78bfa", fieldHeights.get(axialKey(targetCoord)) ?? 0.12, 0);
    this.addBurstCore(group, center, "#f8fafc", "#8b5cf6", 0.15, 0.8);
  }

  private addMinePlacementEffect(
    group: THREE.Group,
    targetCoord: MagicArenaCoord | undefined,
    affectedCoords: MagicArenaCoord[],
    fieldHeights: Map<string, number>
  ): void {
    if (!targetCoord) {
      return;
    }

    this.addTrapPlacementEffect(group, targetCoord, "#ef4444", fieldHeights);
    affectedCoords.forEach((coord, index) => {
      this.addActionRingVisual(group, coord, index === 0 ? "#ef4444" : "#facc15", fieldHeights.get(axialKey(coord)) ?? 0.12, index * 0.04);
    });
  }

  private addStormCloudEffect(group: THREE.Group, targetCoord: MagicArenaCoord | undefined, fieldHeights: Map<string, number>): void {
    if (!targetCoord) {
      return;
    }

    const center = this.getEffectWorld(targetCoord, fieldHeights, 1.05);
    const cloud = new THREE.Group();
    cloud.position.copy(center);
    cloud.userData.magicArenaEffect = this.createEffect({ mode: "bob", createdAt: this.getEffectCreatedAt(), baseY: center.y } satisfies MagicArenaEffect);
    this.addStormCloudModel(cloud, 1.22);
    this.addActionRingVisual(group, targetCoord, "#38bdf8", fieldHeights.get(axialKey(targetCoord)) ?? 0.12, 0);
    this.addBurstCore(group, center.clone().add(new THREE.Vector3(0, -0.48, 0)), "#fde047", "#38bdf8", 0.1, 0.48);
    group.add(cloud);
  }

  private addRoundEventActionVisual(
    group: THREE.Group,
    eventId: string | undefined,
    affectedCoords: MagicArenaCoord[],
    fieldHeights: Map<string, number>
  ): void {
    const coords = affectedCoords.length > 0 ? affectedCoords : [{ q: 0, r: 0 }];
    const color = eventId === "flood_wave"
      ? "#38bdf8"
      : eventId === "earthquake_warning"
        ? "#f97316"
        : eventId === "unstable_arena"
          ? "#facc15"
          : eventId === "arcane_overload"
            ? "#c084fc"
            : eventId === "thin_floor"
              ? "#fb7185"
              : "#34d399";

    coords.forEach((coord, index) => {
      const height = fieldHeights.get(axialKey(coord)) ?? 0.12;
      this.addActionRingVisual(group, coord, color, height, index * 0.04);

      if (eventId === "flood_wave") {
        const world = this.getEffectWorld(coord, fieldHeights, 0.18);
        const wave = new THREE.Mesh(
          new THREE.BoxGeometry(0.72, 0.08, 0.18),
          createGlowMaterial("#38bdf8", 0.42)
        );
        wave.position.copy(world);
        wave.rotation.y = (coord.q + coord.r) * 0.32;
        wave.userData.magicArenaEffect = this.createEffect({ mode: "burst", createdAt: this.getEffectCreatedAt(index * 25), baseScale: 0.7, spin: 0.01 } satisfies MagicArenaEffect);
        group.add(wave);
      } else if (eventId === "earthquake_warning" || eventId === "unstable_arena" || eventId === "thin_floor") {
        const world = axialToWorld(coord);
        const crack = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-0.24, 0, -0.1),
            new THREE.Vector3(-0.06, 0, 0.04),
            new THREE.Vector3(0.1, 0, -0.02),
            new THREE.Vector3(0.28, 0, 0.14)
          ]),
          new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.9, depthWrite: false })
        );
        crack.position.set(world.x, height + 0.13, world.z);
        crack.rotation.y = (coord.q * 0.9 + coord.r * 1.2) % Math.PI;
        crack.userData.magicArenaEffect = this.createEffect({ mode: "quake", createdAt: this.getEffectCreatedAt(index * 35), baseScale: 1, baseY: crack.position.y } satisfies MagicArenaEffect);
        group.add(crack);
      } else if (eventId === "arcane_overload") {
        const burst = this.getEffectWorld(coord, fieldHeights, 0.5);
        this.addBurstCore(group, burst, "#e9d5ff", "#a855f7", 0.2, 0.8);
      } else if (eventId === "treasure_scent") {
        const sparkle = this.getEffectWorld(coord, fieldHeights, 0.36);
        this.addBurstCore(group, sparkle, "#bbf7d0", "#22c55e", 0.14, 0.55);
      }
    });
  }

  private getEffectWorld(coord: MagicArenaCoord, fieldHeights: Map<string, number>, yOffset = 0.2): THREE.Vector3 {
    const world = axialToWorld(coord);
    world.y = (fieldHeights.get(axialKey(coord)) ?? 0.12) + yOffset;
    return world;
  }

  private addWorldBeamVisual(
    group: THREE.Group,
    start: THREE.Vector3,
    end: THREE.Vector3,
    color: string,
    radius: number,
    opacity: number
  ): void {
    const delta = new THREE.Vector3().subVectors(end, start);
    const length = delta.length();

    if (length <= 0.01) {
      return;
    }

    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, length, 10),
      createGlowMaterial(color, opacity)
    );
    beam.position.copy(start).add(delta.multiplyScalar(0.5));
    beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3().subVectors(end, start).normalize());
    beam.userData.magicArenaEffect = this.createEffect({ mode: "strike", createdAt: this.getEffectCreatedAt(), baseScale: 1 } satisfies MagicArenaEffect);
    group.add(beam);
  }

  private addBurstCore(
    group: THREE.Group,
    position: THREE.Vector3,
    color: string,
    glowColor: string,
    radius = 0.18,
    baseScale = 1
  ): void {
    const root = new THREE.Group();
    root.position.copy(position);
    root.userData.magicArenaEffect = this.createEffect({ mode: "burst", createdAt: this.getEffectCreatedAt(), baseScale, spin: 0.04 } satisfies MagicArenaEffect);

    const core = new THREE.Mesh(new THREE.SphereGeometry(radius, 18, 12), createGlowMaterial(color, 0.95));
    const glow = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.75, 18, 12), createGlowMaterial(glowColor, 0.38));
    root.add(core, glow);
    group.add(root);
  }

  private addLightningStrikeEffect(
    group: THREE.Group,
    coord: MagicArenaCoord | undefined,
    fieldHeights: Map<string, number>
  ): void {
    if (!coord) {
      return;
    }

    const impact = this.getEffectWorld(coord, fieldHeights, 0.25);
    const topY = 4.35;

    for (let boltIndex = 0; boltIndex < 3; boltIndex += 1) {
      const points: THREE.Vector3[] = [];

      for (let step = 0; step <= 7; step += 1) {
        const t = step / 7;
        const jitter = Math.sin((coord.q * 17 + coord.r * 23 + boltIndex * 11 + step * 19) * 0.73) * 0.11 * (1 - t * 0.35);
        const side = Math.cos((coord.q * 13 + coord.r * 7 + boltIndex * 5 + step * 31) * 0.51) * 0.09 * (1 - t * 0.35);
        points.push(new THREE.Vector3(jitter, topY * (1 - t) + impact.y * t, side));
      }

      const bolt = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        new THREE.LineBasicMaterial({
          color: boltIndex === 0 ? "#f8fafc" : "#7dd3fc",
          transparent: true,
          opacity: boltIndex === 0 ? 1 : 0.72,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        })
      );
      bolt.position.set(impact.x, 0, impact.z);
      bolt.userData.magicArenaEffect = this.createEffect({ mode: "strike", createdAt: this.getEffectCreatedAt(boltIndex * 90), baseScale: 1 } satisfies MagicArenaEffect);
      group.add(bolt);
    }

    this.addBurstCore(group, impact, "#f8fafc", "#38bdf8", 0.18, 0.8);
    this.addActionRingVisual(group, coord, "#bae6fd", fieldHeights.get(axialKey(coord)) ?? 0.12, 0);
  }

  private addFireballEffect(
    group: THREE.Group,
    originCoord: MagicArenaCoord | undefined,
    targetCoord: MagicArenaCoord | undefined,
    fieldHeights: Map<string, number>
  ): void {
    if (!targetCoord) {
      return;
    }

    const target = this.getEffectWorld(targetCoord, fieldHeights, 0.42);
    const start = originCoord
      ? this.getEffectWorld(originCoord, fieldHeights, 0.95)
      : target.clone().add(new THREE.Vector3(-1.2, 1.3, -0.8));
    const fireball = new THREE.Group();
    fireball.position.copy(start);
    fireball.userData.magicArenaEffect = this.createEffect({ mode: "projectile", createdAt: this.getEffectCreatedAt(), start, end: target, spin: 0.07 } satisfies MagicArenaEffect);
    fireball.add(
      new THREE.Mesh(new THREE.SphereGeometry(0.16, 18, 12), createGlowMaterial("#fde68a", 0.98)),
      new THREE.Mesh(new THREE.SphereGeometry(0.28, 18, 12), createGlowMaterial("#fb923c", 0.42))
    );
    group.add(fireball);
    this.addWorldBeamVisual(group, start, target, "#fb923c", 0.045, 0.38);
    this.addBurstCore(group, target, "#f97316", "#facc15", 0.22, 0.9);
    this.addActionRingVisual(group, targetCoord, "#f97316", fieldHeights.get(axialKey(targetCoord)) ?? 0.12, 0);
  }

  private addBombExplosionEffect(
    group: THREE.Group,
    centerCoord: MagicArenaCoord | undefined,
    affectedCoords: MagicArenaCoord[],
    fieldHeights: Map<string, number>
  ): void {
    const center = centerCoord ?? affectedCoords[0];

    if (!center) {
      return;
    }

    const centerWorld = this.getEffectWorld(center, fieldHeights, 0.38);
    this.addBurstCore(group, centerWorld, "#facc15", "#fb923c", 0.28, 1.05);

    affectedCoords.forEach((coord, index) => {
      this.addActionRingVisual(group, coord, index === 0 ? "#facc15" : "#fb923c", fieldHeights.get(axialKey(coord)) ?? 0.12, index * 0.04);
      const puff = this.getEffectWorld(coord, fieldHeights, 0.26);
      this.addBurstCore(group, puff, "#fdba74", "#ef4444", index === 0 ? 0.17 : 0.1, index === 0 ? 0.72 : 0.48);
    });
  }

  private addMeteorStrikeEffect(
    group: THREE.Group,
    originCoord: MagicArenaCoord | undefined,
    targetCoord: MagicArenaCoord | undefined,
    affectedCoords: MagicArenaCoord[],
    fieldHeights: Map<string, number>
  ): void {
    if (!targetCoord) {
      return;
    }

    const target = this.getEffectWorld(targetCoord, fieldHeights, 0.48);
    const start = target.clone().add(new THREE.Vector3(-2.1, 3.7, -1.7));

    if (originCoord) {
      const origin = this.getEffectWorld(originCoord, fieldHeights, 0.84);
      const focus = target.clone().add(new THREE.Vector3(-0.72, 1.95, -0.55));
      this.addWorldBeamVisual(group, origin, focus, "#c084fc", 0.035, 0.35);
      this.addBurstCore(group, origin, "#f5d0fe", "#a855f7", 0.14, 0.58);
    }

    const meteor = new THREE.Group();
    meteor.position.copy(start);
    meteor.userData.magicArenaEffect = this.createEffect({ mode: "projectile", createdAt: this.getEffectCreatedAt(), start, end: target, spin: 0.09 } satisfies MagicArenaEffect);
    meteor.add(
      new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 14), createGlowMaterial("#f97316", 0.98)),
      new THREE.Mesh(new THREE.SphereGeometry(0.42, 20, 14), createGlowMaterial("#a855f7", 0.34))
    );
    group.add(meteor);
    this.addWorldBeamVisual(group, start, target, "#fb7185", 0.06, 0.44);
    this.addBurstCore(group, target, "#f97316", "#a855f7", 0.34, 1.18);

    affectedCoords.forEach((coord, index) => {
      this.addActionRingVisual(group, coord, index === 0 ? "#f97316" : "#c084fc", fieldHeights.get(axialKey(coord)) ?? 0.12, index * 0.06);
    });
  }

  private addEarthquakeEffect(
    group: THREE.Group,
    originCoord: MagicArenaCoord | undefined,
    affectedCoords: MagicArenaCoord[],
    fieldHeights: Map<string, number>
  ): void {
    const coords = originCoord ? [originCoord, ...affectedCoords] : affectedCoords;

    coords.forEach((coord, index) => {
      const height = fieldHeights.get(axialKey(coord)) ?? 0.12;
      const world = axialToWorld(coord);
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(hexSize * (index === 0 ? 0.46 : 0.52), 0.022, 8, 34),
        createGlowMaterial(index === 0 ? "#fde68a" : "#f97316", index === 0 ? 0.48 : 0.34)
      );
      ring.position.set(world.x, height + 0.075, world.z);
      ring.rotation.x = Math.PI / 2;
      ring.userData.magicArenaEffect = this.createEffect({ mode: "quake", createdAt: this.getEffectCreatedAt(index * 45), baseScale: 1, baseY: ring.position.y } satisfies MagicArenaEffect);
      group.add(ring);

      const crackPoints = [
        new THREE.Vector3(-0.18, 0, -0.1),
        new THREE.Vector3(-0.02, 0, 0.02),
        new THREE.Vector3(0.08, 0, -0.05),
        new THREE.Vector3(0.2, 0, 0.12)
      ];
      const crack = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(crackPoints),
        new THREE.LineBasicMaterial({
          color: "#431407",
          transparent: true,
          opacity: 0.9,
          depthWrite: false
        })
      );
      crack.position.set(world.x, height + 0.11, world.z);
      crack.rotation.y = (coord.q * 0.9 + coord.r * 1.3) % Math.PI;
      crack.userData.magicArenaEffect = this.createEffect({ mode: "quake", createdAt: this.getEffectCreatedAt(index * 35), baseScale: 1, baseY: crack.position.y } satisfies MagicArenaEffect);
      group.add(crack);
    });
  }

  private addActionRingVisual(
    group: THREE.Group,
    coord: MagicArenaCoord,
    color: string,
    fieldHeight: number,
    phaseOffset: number
  ): void {
    const world = axialToWorld(coord);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(hexSize * 0.56, 0.028, 8, 36),
      createMaterial(color, 0.58)
    );
    ring.position.set(world.x, fieldHeight + 0.07, world.z);
    ring.rotation.x = Math.PI / 2;
    ring.userData.magicArenaEffect = this.createEffect({
      mode: "pulse",
      createdAt: this.getEffectCreatedAt(phaseOffset * actionEffectMs),
      baseScale: 1
    } satisfies MagicArenaEffect);
    group.add(ring);
  }

  private addPathStepVisual(group: THREE.Group, coord: MagicArenaCoord, fieldHeight: number, step: number): void {
    const world = axialToWorld(coord);
    const marker = new THREE.Group();
    marker.position.set(world.x, fieldHeight + 0.18, world.z);
    marker.userData.magicArenaEffect = this.createEffect({
      mode: "bob",
      createdAt: this.getEffectCreatedAt(step * 80),
      baseY: marker.position.y
    } satisfies MagicArenaEffect);

    const bead = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 8), createMaterial("#facc15", 0.92));
    marker.add(bead);

    const label = createTextSprite(`${step}`, "#422006", "rgba(250,204,21,0.82)");
    label.position.y = 0.22;
    label.scale.set(0.24, 0.13, 1);
    marker.add(label);
    group.add(marker);
  }

  private addActionBeamVisual(group: THREE.Group, origin: MagicArenaCoord, target: MagicArenaCoord, color: string): void {
    const start = axialToWorld(origin);
    const end = axialToWorld(target);
    start.y = 0.88;
    end.y = 0.88;
    const delta = new THREE.Vector3().subVectors(end, start);
    const length = delta.length();

    if (length <= 0.01) {
      return;
    }

    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.032, length, 10),
      createMaterial(color, 0.56)
    );
    beam.position.copy(start).add(delta.multiplyScalar(0.5));
    beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3().subVectors(end, start).normalize());
    beam.userData.magicArenaEffect = this.createEffect({ mode: "pulse", createdAt: this.getEffectCreatedAt(), baseScale: 1 } satisfies MagicArenaEffect);
    group.add(beam);
  }

  private updateOverlay(): void {
    const overlay = this.overlay;
    const state = this.latestState;

    if (!overlay || !state) {
      return;
    }

    overlay.replaceChildren();

    if (this.debugOverlayVisible) {
      overlay.style.gridTemplateColumns = "minmax(260px, 360px) 1fr minmax(260px, 360px)";
      overlay.appendChild(this.createInfoPanel(state));
      overlay.appendChild(this.createActiveActionPanel(state));
      overlay.appendChild(this.createLogPanel(state));
      return;
    }

    overlay.style.gridTemplateColumns = "1fr";
    overlay.appendChild(this.createActiveActionPanel(state));
  }

  private createInfoPanel(state: MagicArenaPublicState): HTMLDivElement {
    const panel = createPanel();
    const title = document.createElement("strong");
    title.textContent = "Magic Arena";
    title.style.fontSize = "20px";
    title.style.color = "#f8fafc";
    const phase = document.createElement("span");
    const activePlayerName = state.activePlayerId
      ? state.players.find((player) => player.playerId === state.activePlayerId)?.name ?? state.activePlayerId
      : null;
    phase.textContent = `Runde ${state.roundIndex} | ${state.magicPhase}${state.currentSlot !== null ? ` | Slot ${state.currentSlot + 1}` : ""}${
      state.planningMode === "sequential" && state.magicPhase === "planning" && activePlayerName
        ? ` | ${activePlayerName} am Zug`
        : ""
    }`;
    phase.style.color = "#bae6fd";
    panel.append(title, phase);

    for (const player of state.players) {
      const alive = player.figures.filter((figure) => figure.status === "alive").length;
      const water = player.figures.filter((figure) => figure.status === "in_water").length;
      const row = document.createElement("div");
      Object.assign(row.style, {
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) auto",
        gap: "8px",
        alignItems: "center",
        marginTop: "8px",
        padding: "7px 9px",
        borderRadius: "8px",
        background: player.ready ? "rgba(34,197,94,0.16)" : "rgba(15,23,42,0.5)"
      } satisfies Partial<CSSStyleDeclaration>);
      row.innerHTML = `<span style="color:${player.color};font-weight:900;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${player.name}</span><span>${alive} aktiv / ${water} Wasser / ${player.handCount} Karten</span>`;
      panel.appendChild(row);
    }

    return panel;
  }

  private createActiveActionPanel(state: MagicArenaPublicState): HTMLDivElement {
    const panel = document.createElement("div");
    const eventLabel = state.currentRoundEvent
      ? `Rundenereignis: ${state.currentRoundEvent.name}\n${state.currentRoundEvent.description}`
      : "";
    const isRoundEvent = state.activeAction?.kind === "round_event" || Boolean(state.currentRoundEvent);
    const turnLabel =
      state.planningMode === "sequential" && state.magicPhase === "planning" && state.activePlayerId
        ? `${state.players.find((player) => player.playerId === state.activePlayerId)?.name ?? state.activePlayerId} ist am Zug (Zug ${state.planningSlotIndex + 1}/${state.totalPlanningSlots})`
        : "";
    const visible = Boolean(state.activeAction?.label || eventLabel || turnLabel);
    const label = turnLabel
      ? eventLabel
        ? `${turnLabel}\n${eventLabel}`
        : turnLabel
      : state.activeAction?.label ?? eventLabel;

    if (!turnLabel && state.activeAction?.resultLabel) {
      const main = document.createElement("span");
      main.textContent = label;
      main.style.display = "block";
      const result = document.createElement("span");
      result.textContent = state.activeAction.resultLabel;
      Object.assign(result.style, {
        display: "block",
        marginTop: "8px",
        color: "#bbf7d0",
        fontSize: "0.78em",
        opacity: "0",
        animation: `magicArenaResultReveal 180ms ease ${state.activeAction.actionId === "dig" ? "1050ms" : "850ms"} forwards`
      } satisfies Partial<CSSStyleDeclaration>);
      panel.append(main, result);
    } else {
      panel.textContent = label;
    }

    Object.assign(panel.style, {
      justifySelf: "center",
      alignSelf: "start",
      marginTop: "18px",
      minWidth: visible ? (isRoundEvent ? "360px" : "280px") : "0",
      maxWidth: isRoundEvent ? "760px" : "560px",
      padding: visible ? (isRoundEvent ? "18px 28px" : "14px 22px") : "0",
      borderRadius: "8px",
      textAlign: "center",
      color: "#f8fafc",
      fontSize: isRoundEvent ? "28px" : "24px",
      fontWeight: "950",
      letterSpacing: "0",
      whiteSpace: "pre-line",
      background: visible ? (isRoundEvent ? "rgba(30, 27, 75, 0.82)" : "rgba(2, 6, 23, 0.74)") : "transparent",
      border: visible ? (isRoundEvent ? "1px solid rgba(196, 181, 253, 0.48)" : "1px solid rgba(125, 211, 252, 0.28)") : "1px solid transparent",
      boxShadow: visible ? (isRoundEvent ? "0 22px 54px rgba(88, 28, 135, 0.38)" : "0 18px 40px rgba(2, 6, 23, 0.34)") : "none",
      backdropFilter: visible ? "blur(10px)" : "none"
    } satisfies Partial<CSSStyleDeclaration>);
    return panel;
  }

  private createLogPanel(state: MagicArenaPublicState): HTMLDivElement {
    const panel = createPanel();
    const title = document.createElement("strong");
    title.textContent = "Event-Log";
    title.style.fontSize = "18px";
    panel.appendChild(title);

    for (const entry of state.actionLog.slice(-10).reverse()) {
      const line = document.createElement("div");
      line.textContent = entry.message;
      Object.assign(line.style, {
        padding: "6px 0",
        borderBottom: "1px solid rgba(148,163,184,0.12)",
        color: "#cbd5e1",
        fontSize: "13px",
        lineHeight: "1.25"
      } satisfies Partial<CSSStyleDeclaration>);
      panel.appendChild(line);
    }

    return panel;
  }

  private destroySurface(): void {
    this.unsubscribe?.();
    this.unsubscribe = undefined;

    if (this.debugKeyHandler) {
      window.removeEventListener("keydown", this.debugKeyHandler);
      this.debugKeyHandler = undefined;
    }

    if (this.animationId !== null) {
      window.cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    if (this.boardGroup) {
      for (const child of [...this.boardGroup.children]) {
        this.boardGroup.remove(child);
        disposeObject(child);
      }
    }

    this.scene3d?.clear();
    this.threeRenderer?.dispose();
    this.root?.remove();
    this.root = undefined;
    this.overlay = undefined;
    this.threeRenderer = undefined;
    this.scene3d = undefined;
    this.camera = undefined;
    this.boardGroup = undefined;
    this.latestState = null;
    this.figureSnapshots.clear();
    this.activeActionKey = null;
    this.activeActionEffectStartAt = 0;
    this.currentEffectStartAt = 0;
    this.currentEffectDurationMs = actionEffectMs;
  }
}

function sameCoord(left: MagicArenaCoord | undefined, right: MagicArenaCoord | undefined): boolean {
  return Boolean(left && right && left.q === right.q && left.r === right.r);
}

function createPanel(): HTMLDivElement {
  const panel = document.createElement("div");
  Object.assign(panel.style, {
    display: "grid",
    gap: "5px",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid rgba(148, 163, 184, 0.18)",
    background: "rgba(2, 6, 23, 0.72)",
    boxShadow: "0 16px 32px rgba(2, 6, 23, 0.28)",
    backdropFilter: "blur(10px)"
  } satisfies Partial<CSSStyleDeclaration>);
  return panel;
}

export const hostGame = {
  id: magicArenaManifest.id,
  displayName: magicArenaManifest.displayName,
  sceneKey: magicArenaManifest.hostView,
  scene: MagicArenaHostScene
} as const;
