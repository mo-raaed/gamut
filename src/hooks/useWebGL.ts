import { useCallback, useEffect, useRef } from "react";
import { vertexShaderSource } from "@/shaders/vertex";
import { fragmentShaderSource } from "@/shaders/fragment";
import type { AdjustmentState } from "@/types";

interface WebGLPipeline {
  gl: WebGL2RenderingContext;
  program: WebGLProgram;
  texture: WebGLTexture;
  uniforms: Record<string, WebGLUniformLocation>;
  scopeFBO: WebGLFramebuffer;
  scopeTexture: WebGLTexture;
  scopeWidth: number;
  scopeHeight: number;
}

const SCOPE_SIZE = 512;

function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string
): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Failed to create shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile error: ${log}`);
  }
  return shader;
}

function createProgram(
  gl: WebGL2RenderingContext,
  vsSource: string,
  fsSource: string
): WebGLProgram {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);
  const program = gl.createProgram();
  if (!program) throw new Error("Failed to create program");
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    throw new Error(`Program link error: ${log}`);
  }
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  return program;
}

function getUniformLocations(
  gl: WebGL2RenderingContext,
  program: WebGLProgram
): Record<string, WebGLUniformLocation> {
  const names = [
    "uImage",
    "uBrightness",
    "uContrast",
    "uHighlights",
    "uMidtones",
    "uShadows",
    "uSaturation",
    "uVibrance",
    "uTemperature",
    "uTint",
    "uDenoise",
    "uDenoiseGaussian",
    "uDenoiseSP",
    "uDenoiseImpulse",
    "uResolution",
    "uShowClipping",
  ];
  const locs: Record<string, WebGLUniformLocation> = {};
  for (const name of names) {
    const loc = gl.getUniformLocation(program, name);
    if (loc !== null) locs[name] = loc;
  }
  return locs;
}

function createScopeFBO(gl: WebGL2RenderingContext) {
  const fbo = gl.createFramebuffer()!;
  const tex = gl.createTexture()!;

  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA8,
    SCOPE_SIZE,
    SCOPE_SIZE,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    null
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    tex,
    0
  );
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  return { fbo, tex };
}

export function useWebGL(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const pipelineRef = useRef<WebGLPipeline | null>(null);
  const animFrameRef = useRef<number>(0);

  // Initialize the WebGL pipeline (idempotent — safe for StrictMode double-mount)
  const init = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // If pipeline already exists and the GL context is still valid, skip re-init
    if (pipelineRef.current) {
      const existing = pipelineRef.current.gl;
      if (!existing.isContextLost()) return;
    }

    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
    });
    if (!gl) {
      console.error("WebGL2 not available");
      return;
    }

    const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
    const uniforms = getUniformLocations(gl, program);

    // Create image texture
    const texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // Create downscaled FBO for scope data readback
    const { fbo: scopeFBO, tex: scopeTexture } = createScopeFBO(gl);

    pipelineRef.current = {
      gl,
      program,
      texture,
      uniforms,
      scopeFBO,
      scopeTexture,
      scopeWidth: SCOPE_SIZE,
      scopeHeight: SCOPE_SIZE,
    };

    gl.useProgram(program);
  }, [canvasRef]);

  // Upload an image to the GPU texture
  const uploadImage = useCallback((image: HTMLImageElement) => {
    const pipeline = pipelineRef.current;
    if (!pipeline) return;
    const { gl, texture } = pipeline;

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
    }

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      image
    );
  }, [canvasRef]);

  // Render with current adjustments
  const render = useCallback(
    (adjustments: AdjustmentState, showClipping: boolean) => {
      const pipeline = pipelineRef.current;
      if (!pipeline) return;
      const { gl, program, uniforms, texture } = pipeline;
      const canvas = canvasRef.current;
      if (!canvas) return;

      gl.useProgram(program);

      // Bind image texture
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      if (uniforms.uImage) gl.uniform1i(uniforms.uImage, 0);

      // Map -100..+100 to -1..+1
      const m = (v: number) => v / 100;

      if (uniforms.uBrightness) gl.uniform1f(uniforms.uBrightness, m(adjustments.brightness));
      if (uniforms.uContrast) gl.uniform1f(uniforms.uContrast, m(adjustments.contrast));
      if (uniforms.uHighlights) gl.uniform1f(uniforms.uHighlights, m(adjustments.highlights));
      if (uniforms.uMidtones) gl.uniform1f(uniforms.uMidtones, m(adjustments.midtones));
      if (uniforms.uShadows) gl.uniform1f(uniforms.uShadows, m(adjustments.shadows));
      if (uniforms.uSaturation) gl.uniform1f(uniforms.uSaturation, m(adjustments.saturation));
      if (uniforms.uVibrance) gl.uniform1f(uniforms.uVibrance, m(adjustments.vibrance));
      if (uniforms.uTemperature) gl.uniform1f(uniforms.uTemperature, m(adjustments.temperature));
      if (uniforms.uTint) gl.uniform1f(uniforms.uTint, m(adjustments.tint));
      if (uniforms.uDenoise) gl.uniform1f(uniforms.uDenoise, Math.max(0, adjustments.denoise) / 100);
      if (uniforms.uDenoiseGaussian) gl.uniform1f(uniforms.uDenoiseGaussian, Math.max(0, adjustments.denoiseGaussian) / 100);
      if (uniforms.uDenoiseSP) gl.uniform1f(uniforms.uDenoiseSP, Math.max(0, adjustments.denoiseSP) / 100);
      if (uniforms.uDenoiseImpulse) gl.uniform1f(uniforms.uDenoiseImpulse, Math.max(0, adjustments.denoiseImpulse) / 100);
      if (uniforms.uResolution) gl.uniform2f(uniforms.uResolution, canvas.width, canvas.height);
      if (uniforms.uShowClipping) gl.uniform1i(uniforms.uShowClipping, showClipping ? 1 : 0);

      // ── Render to screen ──
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    [canvasRef]
  );

  // Read scope data from a downscaled render
  const readScopeData = useCallback(
    (adjustments: AdjustmentState): Uint8Array | null => {
      const pipeline = pipelineRef.current;
      if (!pipeline) return null;
      const { gl, program, uniforms, texture, scopeFBO, scopeWidth, scopeHeight } = pipeline;

      gl.useProgram(program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      if (uniforms.uImage) gl.uniform1i(uniforms.uImage, 0);

      const m = (v: number) => v / 100;
      if (uniforms.uBrightness) gl.uniform1f(uniforms.uBrightness, m(adjustments.brightness));
      if (uniforms.uContrast) gl.uniform1f(uniforms.uContrast, m(adjustments.contrast));
      if (uniforms.uHighlights) gl.uniform1f(uniforms.uHighlights, m(adjustments.highlights));
      if (uniforms.uMidtones) gl.uniform1f(uniforms.uMidtones, m(adjustments.midtones));
      if (uniforms.uShadows) gl.uniform1f(uniforms.uShadows, m(adjustments.shadows));
      if (uniforms.uSaturation) gl.uniform1f(uniforms.uSaturation, m(adjustments.saturation));
      if (uniforms.uVibrance) gl.uniform1f(uniforms.uVibrance, m(adjustments.vibrance));
      if (uniforms.uTemperature) gl.uniform1f(uniforms.uTemperature, m(adjustments.temperature));
      if (uniforms.uTint) gl.uniform1f(uniforms.uTint, m(adjustments.tint));
      if (uniforms.uDenoise) gl.uniform1f(uniforms.uDenoise, Math.max(0, adjustments.denoise) / 100);
      if (uniforms.uDenoiseGaussian) gl.uniform1f(uniforms.uDenoiseGaussian, Math.max(0, adjustments.denoiseGaussian) / 100);
      if (uniforms.uDenoiseSP) gl.uniform1f(uniforms.uDenoiseSP, Math.max(0, adjustments.denoiseSP) / 100);
      if (uniforms.uDenoiseImpulse) gl.uniform1f(uniforms.uDenoiseImpulse, Math.max(0, adjustments.denoiseImpulse) / 100);
      if (uniforms.uResolution) gl.uniform2f(uniforms.uResolution, scopeWidth, scopeHeight);
      // Disable clipping for scope readback
      if (uniforms.uShowClipping) gl.uniform1i(uniforms.uShowClipping, 0);

      // Render to FBO at reduced resolution
      gl.bindFramebuffer(gl.FRAMEBUFFER, scopeFBO);
      gl.viewport(0, 0, scopeWidth, scopeHeight);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      // Read pixels
      const pixels = new Uint8Array(scopeWidth * scopeHeight * 4);
      gl.readPixels(0, 0, scopeWidth, scopeHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

      // Restore default framebuffer
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);

      return pixels;
    },
    []
  );

  // Cleanup
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return { init, uploadImage, render, readScopeData, pipelineRef };
}
