// ────────────────────────────────────────────
// Gamut — Vertex Shader (fullscreen quad)
// ────────────────────────────────────────────

export const vertexShaderSource = `#version 300 es
precision highp float;

// Fullscreen triangle trick: 3 vertices cover the entire viewport
// No vertex buffer needed — uses gl_VertexID
out vec2 vUV;

void main() {
  // Generate a fullscreen triangle from vertex ID
  float x = float((gl_VertexID & 1) << 2);
  float y = float((gl_VertexID & 2) << 1);
  vUV = vec2(x * 0.5, 1.0 - y * 0.5); // Flip Y for image coords
  gl_Position = vec4(x - 1.0, y - 1.0, 0.0, 1.0);
}
`;
