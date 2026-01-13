import type { GraphicsSettings } from "./CustomRenderer";
import type { SettingsManager } from "./SettingsManager";

/**
 * Settings menu UI that provides controls for all graphics settings
 */
export class SettingsMenu {
  private container: HTMLDivElement;
  private isOpen: boolean = false;
  private settingsManager: SettingsManager;
  private toggleButton: HTMLButtonElement;
  private unsubscribe: (() => void) | null = null;

  constructor(settingsManager: SettingsManager) {
    this.settingsManager = settingsManager;
    this.container = this.createMenuContainer();
    this.toggleButton = this.createToggleButton();

    // Subscribe to settings changes
    this.unsubscribe = this.settingsManager.subscribe((settings) => {
      this.updateUIFromSettings(settings);
    });

    // Initialize UI with current settings
    this.updateUIFromSettings(this.settingsManager.getSettings());

    // Set up keyboard shortcut (ESC to toggle)
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !e.repeat) {
        this.toggle();
      }
    });
  }

  /**
   * Create the toggle button
   */
  private createToggleButton(): HTMLButtonElement {
    const button = document.createElement("button");
    button.className = "settings-toggle-button";
    button.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M12 1v6m0 6v6m5.2-14.2l-4.2 4.2m0 6l-4.2 4.2M23 12h-6m-6 0H1m14.2 5.2l-4.2-4.2m0-6l-4.2-4.2"></path>
      </svg>
      <span>Settings</span>
    `;
    button.title = "Graphics Settings (ESC)";
    button.addEventListener("click", () => this.toggle());
    document.body.appendChild(button);
    return button;
  }

  /**
   * Create the settings menu container
   */
  private createMenuContainer(): HTMLDivElement {
    const container = document.createElement("div");
    container.className = "settings-menu";
    container.style.display = "none";

    container.innerHTML = `
      <div class="settings-menu-content">
        <div class="settings-header">
          <h2>Graphics Settings</h2>
          <button class="settings-close" title="Close (ESC)">×</button>
        </div>

        <div class="settings-body">
          <!-- Presets Section -->
          <div class="settings-section">
            <h3>Quality Presets</h3>
            <div class="preset-buttons">
              <button class="preset-btn" data-preset="ultra">Ultra</button>
              <button class="preset-btn" data-preset="high">High</button>
              <button class="preset-btn" data-preset="medium">Medium</button>
              <button class="preset-btn" data-preset="low">Low</button>
              <button class="preset-btn" data-preset="potato">Potato</button>
            </div>
          </div>

          <!-- Bloom Settings -->
          <div class="settings-section">
            <h3>Bloom Effect</h3>
            <div class="setting-group">
              <label class="checkbox-label">
                <input type="checkbox" id="bloom-enabled" />
                <span>Enable Bloom</span>
              </label>
            </div>
            <div class="setting-group">
              <label for="bloom-intensity">Bloom Intensity</label>
              <div class="slider-container">
                <input type="range" id="bloom-intensity" min="0" max="2" step="0.1" />
                <span class="slider-value" id="bloom-intensity-value">0.5</span>
              </div>
            </div>
            <div class="setting-group">
              <label for="bloom-radius">Bloom Radius</label>
              <div class="slider-container">
                <input type="range" id="bloom-radius" min="0" max="1" step="0.05" />
                <span class="slider-value" id="bloom-radius-value">0.8</span>
              </div>
            </div>
          </div>

          <!-- Anti-aliasing -->
          <div class="settings-section">
            <h3>Anti-Aliasing</h3>
            <div class="setting-group">
              <label class="checkbox-label">
                <input type="checkbox" id="antialiasing" />
                <span>Enable SMAA (High Quality)</span>
              </label>
              <p class="setting-hint">Smooth jagged edges for cleaner visuals</p>
            </div>
          </div>

          <!-- Shadow Quality -->
          <div class="settings-section">
            <h3>Shadow Quality</h3>
            <div class="setting-group">
              <select id="shadow-quality">
                <option value="off">Off</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <!-- Vignette Effect -->
          <div class="settings-section">
            <h3>Vignette Effect</h3>
            <div class="setting-group">
              <label class="checkbox-label">
                <input type="checkbox" id="vignette-enabled" />
                <span>Enable Vignette</span>
              </label>
            </div>
            <div class="setting-group">
              <label for="vignette-intensity">Vignette Intensity</label>
              <div class="slider-container">
                <input type="range" id="vignette-intensity" min="0" max="1" step="0.05" />
                <span class="slider-value" id="vignette-intensity-value">0.5</span>
              </div>
            </div>
          </div>

          <!-- Chromatic Aberration -->
          <div class="settings-section">
            <h3>Chromatic Aberration</h3>
            <div class="setting-group">
              <label class="checkbox-label">
                <input type="checkbox" id="chromatic-aberration-enabled" />
                <span>Enable Chromatic Aberration</span>
              </label>
              <p class="setting-hint">Subtle color distortion at screen edges</p>
            </div>
            <div class="setting-group">
              <label for="chromatic-aberration-intensity">Aberration Intensity</label>
              <div class="slider-container">
                <input type="range" id="chromatic-aberration-intensity" min="0" max="0.01" step="0.0001" />
                <span class="slider-value" id="chromatic-aberration-intensity-value">0.002</span>
              </div>
            </div>
          </div>

          <!-- Depth of Field -->
          <div class="settings-section">
            <h3>Depth of Field</h3>
            <div class="setting-group">
              <label class="checkbox-label">
                <input type="checkbox" id="dof-enabled" />
                <span>Enable Depth of Field</span>
              </label>
              <p class="setting-hint">Blur distant/near objects (experimental)</p>
            </div>
            <div class="setting-group">
              <label for="dof-focus-distance">Focus Distance</label>
              <div class="slider-container">
                <input type="range" id="dof-focus-distance" min="1" max="50" step="1" />
                <span class="slider-value" id="dof-focus-distance-value">10</span>
              </div>
            </div>
            <div class="setting-group">
              <label for="dof-bokeh-scale">Bokeh Scale</label>
              <div class="slider-container">
                <input type="range" id="dof-bokeh-scale" min="0.5" max="10" step="0.5" />
                <span class="slider-value" id="dof-bokeh-scale-value">2.0</span>
              </div>
            </div>
          </div>

          <!-- Camera Settings -->
          <div class="settings-section">
            <h3>Camera</h3>
            <div class="setting-group">
              <label for="fov">Field of View</label>
              <div class="slider-container">
                <input type="range" id="fov" min="50" max="110" step="5" />
                <span class="slider-value" id="fov-value">75</span>
              </div>
            </div>
          </div>

          <!-- Performance Settings -->
          <div class="settings-section">
            <h3>Performance</h3>
            <div class="setting-group">
              <label for="render-scale">Render Resolution Scale</label>
              <div class="slider-container">
                <input type="range" id="render-scale" min="0.25" max="2" step="0.05" />
                <span class="slider-value" id="render-scale-value">1.0</span>
              </div>
              <p class="setting-hint">Lower for better performance, higher for better quality</p>
            </div>
          </div>

          <!-- Reset Button -->
          <div class="settings-section">
            <button class="reset-button" id="reset-settings">Reset to Defaults</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(container);

    // Set up event listeners
    this.setupEventListeners(container);

    return container;
  }

  /**
   * Set up all event listeners for the settings menu
   */
  private setupEventListeners(container: HTMLDivElement): void {
    // Close button
    const closeBtn = container.querySelector(".settings-close") as HTMLButtonElement;
    closeBtn.addEventListener("click", () => this.close());

    // Preset buttons
    const presetButtons = container.querySelectorAll(".preset-btn");
    presetButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const preset = (btn as HTMLElement).dataset.preset;
        if (preset) {
          this.settingsManager.applyPreset(preset as any);
        }
      });
    });

    // Checkboxes
    this.setupCheckbox("bloom-enabled", "bloomEnabled");
    this.setupCheckbox("antialiasing", "antialiasing");
    this.setupCheckbox("vignette-enabled", "vignetteEnabled");
    this.setupCheckbox("chromatic-aberration-enabled", "chromaticAberrationEnabled");
    this.setupCheckbox("dof-enabled", "depthOfFieldEnabled");

    // Sliders
    this.setupSlider("bloom-intensity", "bloomIntensity");
    this.setupSlider("bloom-radius", "bloomRadius");
    this.setupSlider("vignette-intensity", "vignetteIntensity");
    this.setupSlider("chromatic-aberration-intensity", "chromaticAberrationIntensity");
    this.setupSlider("dof-focus-distance", "depthOfFieldFocusDistance");
    this.setupSlider("dof-bokeh-scale", "depthOfFieldBokehScale");
    this.setupSlider("fov", "fov");
    this.setupSlider("render-scale", "renderScale");

    // Shadow quality select
    const shadowQuality = container.querySelector("#shadow-quality") as HTMLSelectElement;
    shadowQuality.addEventListener("change", () => {
      this.settingsManager.updateSettings({
        shadowQuality: shadowQuality.value as GraphicsSettings["shadowQuality"],
      });
    });

    // Reset button
    const resetBtn = container.querySelector("#reset-settings") as HTMLButtonElement;
    resetBtn.addEventListener("click", () => {
      if (confirm("Reset all graphics settings to defaults?")) {
        this.settingsManager.resetToDefaults();
      }
    });

    // Click outside to close
    container.addEventListener("click", (e) => {
      if (e.target === container) {
        this.close();
      }
    });
  }

  /**
   * Set up a checkbox control
   */
  private setupCheckbox(id: string, settingKey: keyof GraphicsSettings): void {
    const checkbox = this.container.querySelector(`#${id}`) as HTMLInputElement;
    checkbox.addEventListener("change", () => {
      this.settingsManager.updateSettings({
        [settingKey]: checkbox.checked,
      } as any);
    });
  }

  /**
   * Set up a slider control
   */
  private setupSlider(id: string, settingKey: keyof GraphicsSettings): void {
    const slider = this.container.querySelector(`#${id}`) as HTMLInputElement;
    const valueDisplay = this.container.querySelector(`#${id}-value`) as HTMLSpanElement;

    slider.addEventListener("input", () => {
      const value = parseFloat(slider.value);
      valueDisplay.textContent = value.toFixed(slider.step.includes(".") ? 2 : 0);
      this.settingsManager.updateSettings({
        [settingKey]: value,
      } as any);
    });
  }

  /**
   * Update UI controls from settings
   */
  private updateUIFromSettings(settings: GraphicsSettings): void {
    // Update checkboxes
    this.updateCheckbox("bloom-enabled", settings.bloomEnabled);
    this.updateCheckbox("antialiasing", settings.antialiasing);
    this.updateCheckbox("vignette-enabled", settings.vignetteEnabled);
    this.updateCheckbox("chromatic-aberration-enabled", settings.chromaticAberrationEnabled);
    this.updateCheckbox("dof-enabled", settings.depthOfFieldEnabled);

    // Update sliders
    this.updateSlider("bloom-intensity", settings.bloomIntensity);
    this.updateSlider("bloom-radius", settings.bloomRadius);
    this.updateSlider("vignette-intensity", settings.vignetteIntensity);
    this.updateSlider("chromatic-aberration-intensity", settings.chromaticAberrationIntensity);
    this.updateSlider("dof-focus-distance", settings.depthOfFieldFocusDistance);
    this.updateSlider("dof-bokeh-scale", settings.depthOfFieldBokehScale);
    this.updateSlider("fov", settings.fov);
    this.updateSlider("render-scale", settings.renderScale);

    // Update select
    const shadowQuality = this.container.querySelector("#shadow-quality") as HTMLSelectElement;
    if (shadowQuality) {
      shadowQuality.value = settings.shadowQuality;
    }
  }

  /**
   * Update a checkbox from settings
   */
  private updateCheckbox(id: string, value: boolean): void {
    const checkbox = this.container.querySelector(`#${id}`) as HTMLInputElement;
    if (checkbox) {
      checkbox.checked = value;
    }
  }

  /**
   * Update a slider and its value display from settings
   */
  private updateSlider(id: string, value: number): void {
    const slider = this.container.querySelector(`#${id}`) as HTMLInputElement;
    const valueDisplay = this.container.querySelector(`#${id}-value`) as HTMLSpanElement;

    if (slider) {
      slider.value = value.toString();
      if (valueDisplay) {
        valueDisplay.textContent = value.toFixed(slider.step.includes(".") ? 2 : 0);
      }
    }
  }

  /**
   * Toggle menu visibility
   */
  public toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Open the settings menu
   */
  public open(): void {
    this.container.style.display = "flex";
    this.isOpen = true;
    this.toggleButton.classList.add("active");
  }

  /**
   * Close the settings menu
   */
  public close(): void {
    this.container.style.display = "none";
    this.isOpen = false;
    this.toggleButton.classList.remove("active");
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    this.container.remove();
    this.toggleButton.remove();
  }
}
