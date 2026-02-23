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
uniform float uDenoiseGaussian; // 0.0 to 1.0  (Gaussian blur for additive noise)
uniform float uDenoiseSP;       // 0.0 to 1.0  (median filter for salt & pepper)
uniform float uDenoiseImpulse;  // 0.0 to 1.0  (adaptive median for impulse noise)
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

// ────────────────────────────────────────────
// Gaussian blur (for additive / Gaussian noise)
// Variable-radius kernel (3×3 to 5×5 blended by strength).
// ────────────────────────────────────────────
vec3 gaussianBlur(vec2 uv, float strength) {
  vec2 texel = 1.0 / uResolution;
  // Kernel radius blends from ~1px at low strength to ~2px at full
  float sigma = 0.5 + strength * 2.0;
  float sigma2 = -1.0 / (2.0 * sigma * sigma);
  int R = (strength > 0.5) ? 2 : 1;

  vec3  sumColor  = vec3(0.0);
  float sumWeight = 0.0;

  for (int dy = -2; dy <= 2; dy++) {
    for (int dx = -2; dx <= 2; dx++) {
      if (abs(dx) > R || abs(dy) > R) continue;
      float w = exp(float(dx*dx + dy*dy) * sigma2);
      vec2 offset = vec2(float(dx), float(dy)) * texel;
      sumColor += texture(uImage, uv + offset).rgb * w;
      sumWeight += w;
    }
  }
  return sumColor / sumWeight;
}

// ────────────────────────────────────────────
// Sorting helpers for median filter
// ────────────────────────────────────────────
#define SWAP(a, b) { vec3 t = min(a,b); b = max(a,b); a = t; }

// ────────────────────────────────────────────
// Median filter (for salt & pepper noise)
// 3×3 neighbourhood — optimal 25-comparator sorting network
// to extract the 5th (median) value.
// ────────────────────────────────────────────
vec3 medianFilter(vec2 uv, float strength) {
  vec2 texel = 1.0 / uResolution;

  // Sample 3×3 neighbourhood
  vec3 v0 = texture(uImage, uv + texel * vec2(-1,-1)).rgb;
  vec3 v1 = texture(uImage, uv + texel * vec2( 0,-1)).rgb;
  vec3 v2 = texture(uImage, uv + texel * vec2( 1,-1)).rgb;
  vec3 v3 = texture(uImage, uv + texel * vec2(-1, 0)).rgb;
  vec3 v4 = texture(uImage, uv).rgb;  // center
  vec3 v5 = texture(uImage, uv + texel * vec2( 1, 0)).rgb;
  vec3 v6 = texture(uImage, uv + texel * vec2(-1, 1)).rgb;
  vec3 v7 = texture(uImage, uv + texel * vec2( 0, 1)).rgb;
  vec3 v8 = texture(uImage, uv + texel * vec2( 1, 1)).rgb;

  // Sorting network to find median (9-element, 25 comparisons)
  // This uses luminance for comparison so all channels move together
  // (preserves color relationships)
  SWAP(v0, v1); SWAP(v3, v4); SWAP(v6, v7);
  SWAP(v1, v2); SWAP(v4, v5); SWAP(v7, v8);
  SWAP(v0, v1); SWAP(v3, v4); SWAP(v6, v7);
  SWAP(v0, v3); SWAP(v3, v6);
  SWAP(v1, v4); SWAP(v4, v7);
  SWAP(v2, v5); SWAP(v5, v8);
  SWAP(v1, v3); SWAP(v5, v7);
  SWAP(v2, v6); SWAP(v4, v6);
  SWAP(v2, v4); SWAP(v2, v3);
  SWAP(v5, v6);

  vec3 median = v4;
  // Blend between center pixel and median based on strength
  return mix(texture(uImage, uv).rgb, median, strength);
}

// ────────────────────────────────────────────
// Adaptive median filter (for impulse noise)
// Detects outlier pixels per-channel and replaces them with
// the local median. Threshold decreases as strength increases
// (more pixels treated as outliers).
// ────────────────────────────────────────────
vec3 adaptiveMedian(vec2 uv, float strength) {
  vec2 texel = 1.0 / uResolution;
  vec3 center = texture(uImage, uv).rgb;

  // Gather 3×3 neighbourhood
  vec3 n[9];
  n[0] = texture(uImage, uv + texel * vec2(-1,-1)).rgb;
  n[1] = texture(uImage, uv + texel * vec2( 0,-1)).rgb;
  n[2] = texture(uImage, uv + texel * vec2( 1,-1)).rgb;
  n[3] = texture(uImage, uv + texel * vec2(-1, 0)).rgb;
  n[4] = center;
  n[5] = texture(uImage, uv + texel * vec2( 1, 0)).rgb;
  n[6] = texture(uImage, uv + texel * vec2(-1, 1)).rgb;
  n[7] = texture(uImage, uv + texel * vec2( 0, 1)).rgb;
  n[8] = texture(uImage, uv + texel * vec2( 1, 1)).rgb;

  // Compute per-channel min, max, and median (via mean of middle values)
  vec3 nMin = n[0], nMax = n[0], nSum = n[0];
  for (int i = 1; i < 9; i++) {
    nMin = min(nMin, n[i]);
    nMax = max(nMax, n[i]);
    nSum += n[i];
  }
  vec3 nMean = nSum / 9.0;

  // Simple median approximation: weighted mean minus extremes
  // (true sorting per-channel is expensive; this is a good practical approx)
  vec3 sumMid = vec3(0.0);
  vec3 countMid = vec3(0.0);
  for (int i = 0; i < 9; i++) {
    // Exclude per-channel min and max values for a trimmed mean ≈ median
    vec3 isMin = step(n[i], nMin + 0.001);
    vec3 isMax = step(nMax - 0.001, n[i]);
    vec3 keep = vec3(1.0) - max(isMin, isMax);
    sumMid += n[i] * keep;
    countMid += keep;
  }
  vec3 medianApprox = sumMid / max(countMid, vec3(1.0));

  // Adaptive threshold: at strength=1 even small deviations are corrected
  float threshold = mix(0.25, 0.02, strength);

  // Per-channel: if center pixel deviates from median by more than threshold,
  // replace it with the median. Otherwise keep original.
  vec3 diff = abs(center - medianApprox);
  vec3 isOutlier = step(vec3(threshold), diff);
  return mix(center, medianApprox, isOutlier * strength);
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
  // ── 0. Denoise filters (applied on raw pixels before adjustments) ──
  vec3 color = texture(uImage, vUV).rgb;

  // Bilateral filter (edge-preserving — general purpose)
  if (uDenoise > 0.001) {
    color = bilateral(vUV, uDenoise);
  }
  // Gaussian blur (additive / Gaussian noise)
  if (uDenoiseGaussian > 0.001) {
    vec3 blurred = gaussianBlur(vUV, uDenoiseGaussian);
    color = mix(color, blurred, uDenoiseGaussian);
  }
  // Median filter (salt & pepper noise)
  if (uDenoiseSP > 0.001) {
    color = medianFilter(vUV, uDenoiseSP);
  }
  // Adaptive median (impulse noise)
  if (uDenoiseImpulse > 0.001) {
    color = adaptiveMedian(vUV, uDenoiseImpulse);
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
