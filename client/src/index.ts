import { Networked3dWebExperienceClient } from "@mml-io/3d-web-experience-client";
import type { CreateRendererOptions } from "@mml-io/3d-web-experience-client";
import { CustomRenderer } from "./CustomRenderer";
import { SettingsManager } from "./SettingsManager";
import { SettingsMenu } from "./SettingsMenu";
import "./styles.css";

const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
const host = window.location.host;
const userNetworkAddress = `${protocol}//${host}/network`;

// Initialize settings manager
const settingsManager = new SettingsManager();

// Store reference to the custom renderer
let customRenderer: CustomRenderer | null = null;

// Create custom renderer factory that uses our CustomRenderer
const createCustomRenderer = (options: CreateRendererOptions) => {
  customRenderer = new CustomRenderer({
    targetElement: options.targetElement,
    coreCameraManager: options.coreCameraManager,
    collisionsManager: options.collisionsManager,
    config: options.config,
    tweakPane: options.tweakPane,
    mmlTargetWindow: options.mmlTargetWindow,
    mmlTargetElement: options.mmlTargetElement,
    loadingProgressManager: options.loadingProgressManager,
    mmlDocuments: options.mmlDocuments,
    mmlAuthToken: options.mmlAuthToken,
  });

  // Apply initial settings
  customRenderer.updateGraphicsSettings(settingsManager.getSettings());

  // Subscribe to settings changes
  settingsManager.subscribe((settings) => {
    if (customRenderer) {
      customRenderer.updateGraphicsSettings(settings);
    }
  });

  // Call the onInitialized callback
  options.onInitialized();

  return customRenderer;
};

const holder = Networked3dWebExperienceClient.createFullscreenHolder();
const app = new Networked3dWebExperienceClient(holder, {
  sessionToken: (window as any).SESSION_TOKEN,
  userNetworkAddress,
  enableChat: true,
  animationConfig: {
    // Using default animations from public MML assets
    airAnimationFileUrl: "https://public.mml.io/anim_air.glb",
    idleAnimationFileUrl: "https://public.mml.io/anim_idle.glb",
    jogAnimationFileUrl: "https://public.mml.io/anim_jog.glb",
    sprintAnimationFileUrl: "https://public.mml.io/anim_run.glb",
    doubleJumpAnimationFileUrl: "https://public.mml.io/anim_double_jump.glb",
  },
  mmlDocuments: {
    minesweeper: { url: `${protocol}//${host}/mml-documents/minesweeper.html` },
  },
  environmentConfiguration: {
    groundPlane: true,
    fog: {
      fogFar: 200,
      fogNear: 50,
      fogColor: {
        r: 26 / 255,
        g: 26 / 255,
        b: 46 / 255,
      },
    },
    sun: {
      intensity: 1.5,
    },
    postProcessing: {
      bloomIntensity: settingsManager.getSettings().bloomIntensity,
    },
  },
  avatarConfiguration: {
    allowCustomAvatars: true,
    availableAvatars: [
      {
        name: "Bot",
        meshFileUrl: "https://public.mml.io/bot.glb",
      },
    ],
  },
  allowOrbitalCamera: true,
  loadingScreen: {
    background: "#1a1a2e",
    color: "#00ff88",
    title: "MINESWEPT",
    subtitle: "3D Multiplayer Minesweeper - Don't step on the mines!",
  },
  spawnConfiguration: {
    spawnPosition: { x: 0, y: 0, z: -5 },
    enableRespawnButton: true,
  },
  postProcessingEnabled: true,
  createRenderer: createCustomRenderer,
});

// Initialize settings menu
const settingsMenu = new SettingsMenu(settingsManager);

// Log settings info
console.log("MINESWEPT with Custom Post-Processing Initialized");
console.log("Press ESC or click the settings button to adjust graphics settings");
console.log("Current settings:", settingsManager.getSettings());

app.update();
