// ────────────────────────────────────────────
// Gamut — Fragment Shader (all adjustments in a single GPU pass)
// ────────────────────────────────────────────

export const fragmentShaderSource = `#version 300 es
precision highp float;

in vec2 vUV;
out vec4 fragColor;

// Image texture
uniform sampler2D uImage;

// ── Global Exposure ──
uniform float uBrightness;  // -1.0 to +1.0 (mapped from -100..+100)
uniform float uContrast;    // -1.0 to +1.0

// ── Tonal Segments ──
uniform float uHighlights;  // -1.0 to +1.0
uniform float uMidtones;    // -1.0 to +1.0
uniform float uShadows;     // -1.0 to +1.0

// ── Color Math ──
uniform float uSaturation;  // -1.0 to +1.0
uniform float uVibrance;    // -1.0 to +1.0
uniform float uTemperature; // -1.0 to +1.0
uniform float uTint;        // -1.0 to +1.0

// ── Clipping ──
uniform bool uShowClipping;

// BT.709 luminance coefficients
const vec3 LUMA_COEFF = vec3(0.2126, 0.7152, 0.0722);

// Attempt to linearize sRGB (approximate)
vec3 srgbToLinear(vec3 c) {
  return pow(c, vec3(2.2));
}

vec3 linearToSrgb(vec3 c) {
  return pow(c, vec3(1.0 / 2.2));
}

// Smooth step mask for tonal ranges
float shadowMask(float luma) {
  return 1.0 - smoothstep(0.0, 0.5, luma);
}

float highlightMask(float luma) {
  return smoothstep(0.5, 1.0, luma);
}

float midtoneMask(float luma) {
  return 1.0 - shadowMask(luma) - highlightMask(luma);
}

void main() {
  vec3 color = texture(uImage, vUV).rgb;

  // ── 1. Brightness (simple additive shift) ──
  color += uBrightness * 0.5;

  // ── 2. Contrast (expand/compress around midpoint) ──
  float contrastFactor = 1.0 + uContrast;
  color = (color - 0.5) * contrastFactor + 0.5;

  // ── 3. Tonal Adjustments (shadows / midtones / highlights) ──
  float luma = dot(color, LUMA_COEFF);
  float sMask = shadowMask(luma);
  float mMask = midtoneMask(luma);
  float hMask = highlightMask(luma);

  // Each tonal adjustment shifts brightness within its masked region
  color += uShadows * 0.5 * sMask;
  color += uMidtones * 0.3 * mMask;
  color += uHighlights * 0.5 * hMask;

  // ── 4. White Balance (Temperature + Tint) ──
  // Temperature: shift blue ↔ orange (warm/cool)
  // Tint: shift green ↔ magenta
  color.r += uTemperature * 0.1;
  color.b -= uTemperature * 0.1;
  color.g += uTint * 0.1;
  color.r -= uTint * 0.05;
  color.b -= uTint * 0.05;

  // ── 5. Saturation (uniform boost/cut) ──
  float lumaAfterWB = dot(color, LUMA_COEFF);
  float satFactor = 1.0 + uSaturation;
  color = mix(vec3(lumaAfterWB), color, satFactor);

  // ── 6. Vibrance (boost muted colors more) ──
  float maxC = max(color.r, max(color.g, color.b));
  float minC = min(color.r, min(color.g, color.b));
  float currentSat = (maxC - minC) / (maxC + 0.001); // avoid div by zero
  // Vibrance factor: more boost for less-saturated pixels
  float vibFactor = 1.0 + uVibrance * (1.0 - currentSat);
  float lumaForVib = dot(color, LUMA_COEFF);
  color = mix(vec3(lumaForVib), color, vibFactor);

  // ── Clamp to valid range ──
  color = clamp(color, 0.0, 1.0);

  // ── Clipping Overlay ──
  if (uShowClipping) {
    bool clippedHigh = any(greaterThan(color, vec3(0.99)));
    bool clippedLow = any(lessThan(color, vec3(0.01)));
    if (clippedHigh && clippedLow) {
      color = vec3(1.0, 0.0, 1.0); // magenta = both
    } else if (clippedHigh) {
      color = vec3(1.0, 0.0, 0.0); // red = highlight clip
    } else if (clippedLow) {
      color = vec3(0.0, 0.3, 1.0); // blue = shadow clip
    }
  }

  fragColor = vec4(color, 1.0);
}
`;
