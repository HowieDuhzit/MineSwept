import { ThreeJSWorldRenderer } from "@mml-io/3d-web-threejs";
import type { ThreeJSRendererOptions, RenderState } from "@mml-io/3d-web-client-core";
import * as THREE from "three";
import {
  EffectComposer,
  EffectPass,
  RenderPass,
  BloomEffect,
  SMAAEffect,
  VignetteEffect,
  ChromaticAberrationEffect,
  DepthOfFieldEffect,
  SMAAPreset,
  BlendFunction,
} from "postprocessing";

export interface GraphicsSettings {
  bloomEnabled: boolean;
  bloomIntensity: number;
  bloomRadius: number;
  antialiasing: boolean;
  shadowQuality: "off" | "low" | "medium" | "high";
  vignetteEnabled: boolean;
  vignetteIntensity: number;
  chromaticAberrationEnabled: boolean;
  chromaticAberrationIntensity: number;
  depthOfFieldEnabled: boolean;
  depthOfFieldFocusDistance: number;
  depthOfFieldBokehScale: number;
  fov: number;
  renderScale: number;
}

export const DEFAULT_SETTINGS: GraphicsSettings = {
  bloomEnabled: true,
  bloomIntensity: 0.5,
  bloomRadius: 0.8,
  antialiasing: true,
  shadowQuality: "medium",
  vignetteEnabled: false,
  vignetteIntensity: 0.5,
  chromaticAberrationEnabled: false,
  chromaticAberrationIntensity: 0.002,
  depthOfFieldEnabled: false,
  depthOfFieldFocusDistance: 10,
  depthOfFieldBokehScale: 2,
  fov: 75,
  renderScale: 1.0,
};

/**
 * Custom renderer that extends ThreeJSWorldRenderer with advanced post-processing effects
 */
export class CustomRenderer extends ThreeJSWorldRenderer {
  private customComposer: EffectComposer | null = null;
  private effectsPass: EffectPass | null = null;
  private bloomEffect: BloomEffect | null = null;
  private smaaEffect: SMAAEffect | null = null;
  private vignetteEffect: VignetteEffect | null = null;
  private chromaticAberrationEffect: ChromaticAberrationEffect | null = null;
  private depthOfFieldEffect: DepthOfFieldEffect | null = null;
  private settings: GraphicsSettings = { ...DEFAULT_SETTINGS };
  private renderer: THREE.WebGLRenderer | null = null;
  private camera: THREE.Camera | null = null;
  private scene: THREE.Scene | null = null;

  constructor(options: ThreeJSRendererOptions) {
    super(options);

    // Access internal renderer through reflection (since it's private in parent)
    // This is a bit hacky but necessary to access the WebGLRenderer
    this.extractThreeJSObjects();

    if (this.renderer && this.camera && this.scene) {
      this.setupPostProcessing();
    }
  }

  /**
   * Extract Three.js objects from the parent class using reflection
   */
  private extractThreeJSObjects(): void {
    try {
      // Access the parent's private composer which contains the renderer
      const parentAny = this as any;

      // The parent ThreeJSWorldRenderer has a 'composer' property
      if (parentAny.composer) {
        this.renderer = parentAny.composer.renderer as THREE.WebGLRenderer;
      }

      // Get camera from threeJSCameraManager
      if (parentAny.threeJSCameraManager?.camera) {
        this.camera = parentAny.threeJSCameraManager.camera;
      }

      // Get scene
      if (parentAny.scene) {
        this.scene = parentAny.scene;
      }
    } catch (error) {
      console.warn("Failed to extract Three.js objects for custom post-processing:", error);
    }
  }

  /**
   * Set up post-processing pipeline with all effects
   */
  private setupPostProcessing(): void {
    if (!this.renderer || !this.camera || !this.scene) {
      console.warn("Cannot setup post-processing: missing renderer, camera, or scene");
      return;
    }

    // Create composer
    this.customComposer = new EffectComposer(this.renderer, {
      frameBufferType: THREE.HalfFloatType,
      multisampling: this.settings.antialiasing ? 8 : 0,
    });

    // Add render pass
    const renderPass = new RenderPass(this.scene, this.camera);
    this.customComposer.addPass(renderPass);

    // Create effects
    this.createEffects();

    // Create effects pass with all enabled effects
    this.updateEffectsPass();

    // Update render scale
    this.updateRenderScale();

    console.log("Custom post-processing initialized");
  }

  /**
   * Create all post-processing effects
   */
  private createEffects(): void {
    if (!this.camera) return;

    // Bloom effect
    this.bloomEffect = new BloomEffect({
      intensity: this.settings.bloomIntensity,
      luminanceThreshold: 0.15,
      luminanceSmoothing: 0.9,
      mipmapBlur: true,
    });

    // SMAA (anti-aliasing) effect
    this.smaaEffect = new SMAAEffect({
      preset: SMAAPreset.HIGH,
    });

    // Vignette effect
    this.vignetteEffect = new VignetteEffect({
      darkness: this.settings.vignetteIntensity,
      offset: 0.5,
    });

    // Chromatic Aberration effect
    this.chromaticAberrationEffect = new ChromaticAberrationEffect({
      offset: new THREE.Vector2(
        this.settings.chromaticAberrationIntensity,
        this.settings.chromaticAberrationIntensity
      ),
    });

    // Depth of Field effect
    if (this.camera instanceof THREE.PerspectiveCamera) {
      this.depthOfFieldEffect = new DepthOfFieldEffect(this.camera, {
        focusDistance: this.settings.depthOfFieldFocusDistance / 100,
        focalLength: 0.1,
        bokehScale: this.settings.depthOfFieldBokehScale,
        height: 480,
      });
    }
  }

  /**
   * Update the effects pass with currently enabled effects
   */
  private updateEffectsPass(): void {
    if (!this.customComposer) return;

    // Remove old effects pass
    if (this.effectsPass) {
      this.customComposer.removePass(this.effectsPass);
      this.effectsPass.dispose();
    }

    // Collect enabled effects
    const effects: any[] = [];

    if (this.settings.bloomEnabled && this.bloomEffect) {
      effects.push(this.bloomEffect);
    }

    if (this.settings.antialiasing && this.smaaEffect) {
      effects.push(this.smaaEffect);
    }

    if (this.settings.vignetteEnabled && this.vignetteEffect) {
      effects.push(this.vignetteEffect);
    }

    if (this.settings.chromaticAberrationEnabled && this.chromaticAberrationEffect) {
      effects.push(this.chromaticAberrationEffect);
    }

    if (this.settings.depthOfFieldEnabled && this.depthOfFieldEffect) {
      effects.push(this.depthOfFieldEffect);
    }

    // Only create effects pass if we have effects
    if (effects.length > 0) {
      this.effectsPass = new EffectPass(this.camera!, ...effects);
      this.customComposer.addPass(this.effectsPass);
    }
  }

  /**
   * Update graphics settings and apply changes
   */
  public updateGraphicsSettings(newSettings: Partial<GraphicsSettings>): void {
    const oldSettings = { ...this.settings };
    this.settings = { ...this.settings, ...newSettings };

    // Update shadow quality
    if (newSettings.shadowQuality !== undefined && this.renderer) {
      this.updateShadowQuality(newSettings.shadowQuality);
    }

    // Update FOV
    if (newSettings.fov !== undefined && this.camera instanceof THREE.PerspectiveCamera) {
      this.camera.fov = newSettings.fov;
      this.camera.updateProjectionMatrix();
    }

    // Update render scale
    if (newSettings.renderScale !== undefined) {
      this.updateRenderScale();
    }

    // Update bloom settings
    if (this.bloomEffect) {
      if (newSettings.bloomIntensity !== undefined) {
        this.bloomEffect.intensity = newSettings.bloomIntensity;
      }
    }

    // Update vignette settings
    if (this.vignetteEffect && newSettings.vignetteIntensity !== undefined) {
      this.vignetteEffect.darkness = newSettings.vignetteIntensity;
    }

    // Update chromatic aberration settings
    if (this.chromaticAberrationEffect && newSettings.chromaticAberrationIntensity !== undefined) {
      this.chromaticAberrationEffect.offset.set(
        newSettings.chromaticAberrationIntensity,
        newSettings.chromaticAberrationIntensity
      );
    }

    // Update depth of field settings
    if (this.depthOfFieldEffect) {
      if (newSettings.depthOfFieldFocusDistance !== undefined) {
        this.depthOfFieldEffect.circleOfConfusionMaterial.uniforms.focusDistance.value =
          newSettings.depthOfFieldFocusDistance / 100;
      }
      if (newSettings.depthOfFieldBokehScale !== undefined) {
        this.depthOfFieldEffect.bokehScale = newSettings.depthOfFieldBokehScale;
      }
    }

    // Rebuild effects pass if enable/disable states changed
    const needsRebuild =
      newSettings.bloomEnabled !== undefined && newSettings.bloomEnabled !== oldSettings.bloomEnabled ||
      newSettings.antialiasing !== undefined && newSettings.antialiasing !== oldSettings.antialiasing ||
      newSettings.vignetteEnabled !== undefined && newSettings.vignetteEnabled !== oldSettings.vignetteEnabled ||
      newSettings.chromaticAberrationEnabled !== undefined && newSettings.chromaticAberrationEnabled !== oldSettings.chromaticAberrationEnabled ||
      newSettings.depthOfFieldEnabled !== undefined && newSettings.depthOfFieldEnabled !== oldSettings.depthOfFieldEnabled;

    if (needsRebuild) {
      this.updateEffectsPass();
    }

    console.log("Graphics settings updated:", this.settings);
  }

  /**
   * Update shadow quality settings
   */
  private updateShadowQuality(quality: GraphicsSettings["shadowQuality"]): void {
    if (!this.renderer) return;

    switch (quality) {
      case "off":
        this.renderer.shadowMap.enabled = false;
        break;
      case "low":
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.BasicShadowMap;
        break;
      case "medium":
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFShadowMap;
        break;
      case "high":
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        break;
    }

    // Update all shadow-casting lights
    if (this.scene) {
      this.scene.traverse((object) => {
        if (object instanceof THREE.Light && object.castShadow) {
          const mapSize = quality === "high" ? 2048 : quality === "medium" ? 1024 : 512;
          if (object.shadow) {
            object.shadow.mapSize.width = mapSize;
            object.shadow.mapSize.height = mapSize;
            object.shadow.map?.dispose();
            object.shadow.map = null as any;
          }
        }
      });
    }
  }

  /**
   * Update render resolution scale
   */
  private updateRenderScale(): void {
    if (!this.customComposer || !this.renderer) return;

    const canvas = this.renderer.domElement;
    const width = canvas.clientWidth * this.settings.renderScale;
    const height = canvas.clientHeight * this.settings.renderScale;

    this.customComposer.setSize(width, height, false);
  }

  /**
   * Override render method to use custom composer
   */
  public render(state: RenderState): void {
    // Call parent render first (this updates the scene)
    super.render(state);

    // If we have a custom composer, render with post-processing
    if (this.customComposer && this.effectsPass) {
      // The parent has already updated the scene, we just need to render with post-processing
      this.customComposer.render();
    }
  }

  /**
   * Override fitContainer to update composer size
   */
  public fitContainer(): void {
    super.fitContainer();
    this.updateRenderScale();
  }

  /**
   * Get current graphics settings
   */
  public getGraphicsSettings(): GraphicsSettings {
    return { ...this.settings };
  }

  /**
   * Clean up custom resources
   */
  public dispose(): void {
    if (this.customComposer) {
      this.customComposer.dispose();
    }

    if (this.effectsPass) {
      this.effectsPass.dispose();
    }

    this.bloomEffect?.dispose();
    this.smaaEffect?.dispose();
    this.vignetteEffect?.dispose();
    this.chromaticAberrationEffect?.dispose();
    this.depthOfFieldEffect?.dispose();

    super.dispose();
  }
}
