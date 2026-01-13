import type { GraphicsSettings } from "./CustomRenderer";
import { DEFAULT_SETTINGS } from "./CustomRenderer";

const STORAGE_KEY = "mineswept_graphics_settings";

/**
 * Manages graphics settings persistence and provides callbacks for changes
 */
export class SettingsManager {
  private settings: GraphicsSettings;
  private listeners: Set<(settings: GraphicsSettings) => void> = new Set();

  constructor() {
    this.settings = this.loadSettings();
  }

  /**
   * Load settings from localStorage or use defaults
   */
  private loadSettings(): GraphicsSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to handle new settings added in updates
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (error) {
      console.warn("Failed to load graphics settings from localStorage:", error);
    }
    return { ...DEFAULT_SETTINGS };
  }

  /**
   * Save settings to localStorage
   */
  private saveSettings(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.warn("Failed to save graphics settings to localStorage:", error);
    }
  }

  /**
   * Get current settings
   */
  public getSettings(): GraphicsSettings {
    return { ...this.settings };
  }

  /**
   * Update settings and notify listeners
   */
  public updateSettings(updates: Partial<GraphicsSettings>): void {
    this.settings = { ...this.settings, ...updates };
    this.saveSettings();
    this.notifyListeners();
  }

  /**
   * Reset settings to defaults
   */
  public resetToDefaults(): void {
    this.settings = { ...DEFAULT_SETTINGS };
    this.saveSettings();
    this.notifyListeners();
  }

  /**
   * Subscribe to settings changes
   */
  public subscribe(listener: (settings: GraphicsSettings) => void): () => void {
    this.listeners.add(listener);
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of settings changes
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.getSettings());
      } catch (error) {
        console.error("Error in settings listener:", error);
      }
    });
  }

  /**
   * Get settings presets for quick selection
   */
  public static getPresets(): Record<string, Partial<GraphicsSettings>> {
    return {
      ultra: {
        bloomEnabled: true,
        bloomIntensity: 1.0,
        bloomRadius: 0.9,
        antialiasing: true,
        shadowQuality: "high",
        vignetteEnabled: true,
        vignetteIntensity: 0.3,
        chromaticAberrationEnabled: true,
        chromaticAberrationIntensity: 0.001,
        depthOfFieldEnabled: false,
        renderScale: 1.0,
      },
      high: {
        bloomEnabled: true,
        bloomIntensity: 0.7,
        bloomRadius: 0.8,
        antialiasing: true,
        shadowQuality: "high",
        vignetteEnabled: false,
        chromaticAberrationEnabled: false,
        depthOfFieldEnabled: false,
        renderScale: 1.0,
      },
      medium: {
        bloomEnabled: true,
        bloomIntensity: 0.5,
        bloomRadius: 0.7,
        antialiasing: true,
        shadowQuality: "medium",
        vignetteEnabled: false,
        chromaticAberrationEnabled: false,
        depthOfFieldEnabled: false,
        renderScale: 1.0,
      },
      low: {
        bloomEnabled: false,
        antialiasing: false,
        shadowQuality: "low",
        vignetteEnabled: false,
        chromaticAberrationEnabled: false,
        depthOfFieldEnabled: false,
        renderScale: 0.75,
      },
      potato: {
        bloomEnabled: false,
        antialiasing: false,
        shadowQuality: "off",
        vignetteEnabled: false,
        chromaticAberrationEnabled: false,
        depthOfFieldEnabled: false,
        renderScale: 0.5,
      },
    };
  }

  /**
   * Apply a preset
   */
  public applyPreset(presetName: keyof ReturnType<typeof SettingsManager.getPresets>): void {
    const presets = SettingsManager.getPresets();
    const preset = presets[presetName];
    if (preset) {
      this.updateSettings(preset);
    }
  }
}
