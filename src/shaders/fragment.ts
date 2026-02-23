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

// ── Detail ──
uniform float uDenoise;     // 0.0 to 1.0  (0 = off, 1 = max smoothing)
uniform vec2  uResolution;  // pixel dimensions of texture

// ── Clipping ──
uniform bool uShowClipping;

// BT.709 luminance coefficients
const vec3 LUMA_COEFF = vec3(0.2126, 0.7152, 0.0722);

// ────────────────────────────────────────────
// Bilateral filter (edge-preserving denoise)
// Samples a 5×5 neighbourhood.
// Spatial sigma is fixed; range sigma scales with uDenoise.
// ────────────────────────────────────────────
vec3 bilateral(vec2 uv, float strength) {
  vec2 texel = 1.0 / uResolution;
  vec3 center = texture(uImage, uv).rgb;
  float rangeSigma = 0.05 + strength * 0.35; // higher = more smoothing
  float rangeSigma2 = -1.0 / (2.0 * rangeSigma * rangeSigma);

  vec3  sumColor  = vec3(0.0);
  float sumWeight = 0.0;

  // Spatial weights for a 5×5 kernel (pre-computed Gaussian, sigma≈1.5)
  const int R = 2;
  for (int dy = -R; dy <= R; dy++) {
    for (int dx = -R; dx <= R; dx++) {
      vec2 offset = vec2(float(dx), float(dy)) * texel;
      vec3 sampleC = texture(uImage, uv + offset).rgb;
      vec3 diff = sampleC - center;
      float dist2 = dot(diff, diff);

      // Spatial Gaussian (sigma=1.5, pre-squared=2.25)
      float spatialW = exp(-float(dx*dx + dy*dy) / 4.5);
      // Range Gaussian
      float rangeW = exp(dist2 * rangeSigma2);

      float w = spatialW * rangeW;
      sumColor += sampleC * w;
      sumWeight += w;
    }
  }
  return sumColor / sumWeight;
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
  // ── 0. Denoise (bilateral filter — done first on raw pixels) ──
  vec3 color;
  if (uDenoise > 0.001) {
    color = bilateral(vUV, uDenoise);
  } else {
    color = texture(uImage, vUV).rgb;
  }

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
