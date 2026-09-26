import React, { useEffect, useRef } from "react";

export interface GlowingRidgesProps {
  layers?: number;
  detail?: number;
  turbulence?: number;
  zoom?: number;
  shiftX?: number;
  shiftY?: number;
  ridgeFrequency?: number;
  ridgePhase?: number;
  density?: number;
  flowSpeed?: number;
  churnSpeed?: number;
  swirl?: number;
  exposure?: number;
  gain?: number;
  colorCycle?: number;
  rotation?: number;
  grain?: number;
  opacity?: number;
  colorA?: string;
  colorB?: string;
  colorC?: string;
  backgroundColor?: string;
  blend?: "add" | "ink";
  paused?: boolean;
  dpr?: number;
  className?: string;
  children?: React.ReactNode;
}

function hexToRgb(hex: string): [number, number, number] {
  let cleaned = hex.replace("#", "").trim();
  if (cleaned.length === 3) {
    cleaned = cleaned
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const num = parseInt(cleaned, 16);
  if (isNaN(num)) return [0, 0, 0];
  return [((num >> 16) & 255) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255];
}

const VERTEX_SHADER = `
attribute vec2 a_position;
varying vec2 vUv;

void main() {
  vUv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;

#define MAX_LAYERS 15
#define MAX_DETAIL 10

varying vec2 vUv;

uniform vec2 uResolution;
uniform float uFlow;
uniform float uChurn;
uniform float uLayers;
uniform float uDetail;
uniform float uTurbulence;
uniform float uZoom;
uniform vec2 uShift;
uniform float uRidgeFrequency;
uniform float uRidgePhase;
uniform float uDensity;
uniform float uSwirl;
uniform float uExposure;
uniform float uGain;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;
uniform float uColorCycle;
uniform float uRotation;
uniform float uGrain;
uniform float uOpacity;
uniform vec3 uBackground;
uniform float uInk;

float hash(vec2 p) {
  p = fract(p * vec2(443.897, 441.423));
  p += dot(p, p.yx + 19.19);
  return fract(p.x * p.y);
}

vec3 palette(float layer) {
  vec3 w = 0.25 + 1.0 * cos(layer * uColorCycle + vec3(0.0, 2.094395, 4.18879));
  return uColorA * w.x + uColorB * w.y + uColorC * w.z;
}

vec3 fastTanh(vec3 x) {
  vec3 cx = clamp(x, 0.0, 15.0);
  vec3 exp2x = exp(2.0 * cx);
  return (exp2x - 1.0) / (exp2x + 1.0);
}

void main() {
  vec2 coord = vUv;
  float currentAspect = uResolution.x / uResolution.y;
  float refAspect = 16.0 / 9.0;
  if (currentAspect < refAspect) {
    float factor = currentAspect / refAspect;
    coord.x = (coord.x - 0.5) * factor + 0.55;
  }

  float c = cos(uRotation);
  float sn = sin(uRotation);
  vec2 turned = mat2(c, -sn, sn, c) * (coord - 0.5) + 0.5;
  vec2 uv = (turned - 1.0) * uZoom - uShift;

  vec2 p = (uv + vec2(0.6, -0.1)) * uDensity;

  uv *= sin(log(max(abs(uv.y), 1e-4)) * uRidgeFrequency + uRidgePhase);

  float radius = normalize(vec3(length(uv), 0.1, 0.51)).x;
  float drift = (log2(radius) * 15.0 + uFlow) * uSwirl;
  float bearing = sin(atan(uv.y, uv.x));
  vec2 push = sin(vec2(bearing, drift));

  vec3 film = vec3(0.0);
  for (int i = 0; i < MAX_LAYERS; i++) {
    float fi = float(i);
    if (fi >= uLayers) break;
    float layer = fi + 1.0;

    vec2 v = p;
    float f = 1.0;
    for (int k = 0; k < MAX_DETAIL; k++) {
      float fk = float(k);
      if (fk >= uDetail) break;

      v += (tan(cos(v.yx * f + f + layer - uChurn)) * uTurbulence + 2.5) / f;
      v += push;
      f *= 1.5;
    }

    film += palette(layer) / (5.0 * length(v));
  }

  vec3 light = fastTanh(max(film, 0.0) * uExposure) * uGain;

  float noise = hash(gl_FragCoord.xy + fract(uChurn) * 1000.0) - 0.5;
  light *= 1.0 + noise * uGrain;
  light *= uOpacity;

  vec3 lit = uBackground + light;

  float amount = max(light.r, max(light.g, light.b));
  float coverage = smoothstep(0.08, 0.6, amount);
  vec3 pigment = amount > 0.0001 ? light / amount : vec3(1.0);
  vec3 inked = uBackground * mix(vec3(1.0), pigment * 0.75, coverage);

  gl_FragColor = vec4(clamp(mix(lit, inked, uInk), 0.0, 1.0), 1.0);
}
`;

function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Shader compile error:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export const GlowingRidges: React.FC<GlowingRidgesProps> = ({
  layers = 12,
  detail = 5,
  turbulence = 0.6,
  zoom = 1.1,
  shiftX = 0.45,
  shiftY = 0.5,
  ridgeFrequency = 1,
  ridgePhase = 2,
  density = 11,
  flowSpeed = 0.1,
  churnSpeed = 1,
  swirl = 16,
  exposure = 0.25,
  gain = 2,
  colorA = "#ff6a2a",
  colorB = "#22d3ee",
  colorC = "#c026d3",
  colorCycle = 0.4,
  rotation = 0,
  grain = 0.25,
  opacity = 0.75,
  backgroundColor = "#000000",
  blend = "add",
  paused = false,
  dpr = 1,
  className,
  children,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isVisibleRef = useRef(true);

  // References to keep up-to-date props without tearing down WebGL program
  const propsRef = useRef({
    layers,
    detail,
    turbulence,
    zoom,
    shiftX,
    shiftY,
    ridgeFrequency,
    ridgePhase,
    density,
    flowSpeed,
    churnSpeed,
    swirl,
    exposure,
    gain,
    colorA,
    colorB,
    colorC,
    colorCycle,
    rotation,
    grain,
    opacity,
    backgroundColor,
    blend,
    paused,
    dpr,
  });

  useEffect(() => {
    propsRef.current = {
      layers,
      detail,
      turbulence,
      zoom,
      shiftX,
      shiftY,
      ridgeFrequency,
      ridgePhase,
      density,
      flowSpeed,
      churnSpeed,
      swirl,
      exposure,
      gain,
      colorA,
      colorB,
      colorC,
      colorCycle,
      rotation,
      grain,
      opacity,
      backgroundColor,
      blend,
      paused,
      dpr,
    };
  }, [
    layers,
    detail,
    turbulence,
    zoom,
    shiftX,
    shiftY,
    ridgeFrequency,
    ridgePhase,
    density,
    flowSpeed,
    churnSpeed,
    swirl,
    exposure,
    gain,
    colorA,
    colorB,
    colorC,
    colorCycle,
    rotation,
    grain,
    opacity,
    backgroundColor,
    blend,
    paused,
    dpr,
  ]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
      },
      { threshold: 0 }
    );
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl =
      canvas.getContext("webgl", {
        antialias: false,
        alpha: false,
        powerPreference: "high-performance",
        preserveDrawingBuffer: false,
      }) ||
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);

    if (!gl) {
      console.warn("WebGL not supported for GlowingRidges.");
      return;
    }

    const vs = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Quad geometry covering [-1, 1]
    const quadVertices = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]);

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);

    const posAttrib = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(posAttrib);
    gl.vertexAttribPointer(posAttrib, 2, gl.FLOAT, false, 0, 0);

    // Uniform locations
    const locResolution = gl.getUniformLocation(program, "uResolution");
    const locFlow = gl.getUniformLocation(program, "uFlow");
    const locChurn = gl.getUniformLocation(program, "uChurn");
    const locLayers = gl.getUniformLocation(program, "uLayers");
    const locDetail = gl.getUniformLocation(program, "uDetail");
    const locTurbulence = gl.getUniformLocation(program, "uTurbulence");
    const locZoom = gl.getUniformLocation(program, "uZoom");
    const locShift = gl.getUniformLocation(program, "uShift");
    const locRidgeFrequency = gl.getUniformLocation(program, "uRidgeFrequency");
    const locRidgePhase = gl.getUniformLocation(program, "uRidgePhase");
    const locDensity = gl.getUniformLocation(program, "uDensity");
    const locSwirl = gl.getUniformLocation(program, "uSwirl");
    const locExposure = gl.getUniformLocation(program, "uExposure");
    const locGain = gl.getUniformLocation(program, "uGain");
    const locColorA = gl.getUniformLocation(program, "uColorA");
    const locColorB = gl.getUniformLocation(program, "uColorB");
    const locColorC = gl.getUniformLocation(program, "uColorC");
    const locColorCycle = gl.getUniformLocation(program, "uColorCycle");
    const locRotation = gl.getUniformLocation(program, "uRotation");
    const locGrain = gl.getUniformLocation(program, "uGrain");
    const locOpacity = gl.getUniformLocation(program, "uOpacity");
    const locBackground = gl.getUniformLocation(program, "uBackground");
    const locInk = gl.getUniformLocation(program, "uInk");

    let animId: number;
    let lastTime = performance.now();
    let lastFrameTime = performance.now();
    let flowAccum = 0;
    let churnAccum = 0;
    let isDocumentVisible =
      typeof document === "undefined" ? true : document.visibilityState === "visible";

    const isMobileViewport = () => {
      if (typeof window === "undefined") return false;
      return window.innerWidth < 768 || (window.screen && window.screen.width < 768);
    };

    const resize = () => {
      const parent = canvas.parentElement;
      const width = parent ? parent.clientWidth : window.innerWidth;
      const height = parent ? parent.clientHeight : window.innerHeight;
      const isMobile = isMobileViewport();
      // On mobile screens, clamp DPR to 0.8 (under blur(6.5px), visuals are identical while fill rate drops by ~90%)
      // On desktop, keep exact prop dpr or window.devicePixelRatio
      const maxDpr = isMobile ? 0.8 : propsRef.current.dpr || 1;
      const pixelRatio = Math.min(window.devicePixelRatio || 1, maxDpr);
      const displayWidth = Math.max(1, Math.floor(width * pixelRatio));
      const displayHeight = Math.max(1, Math.floor(height * pixelRatio));

      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        gl.viewport(0, 0, displayWidth, displayHeight);
      }
    };

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && canvas.parentElement) {
      resizeObserver = new ResizeObserver(() => {
        resize();
      });
      resizeObserver.observe(canvas.parentElement);
    }

    window.addEventListener("resize", resize);
    resize();

    const onVisibilityChange = () => {
      isDocumentVisible = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    const render = (now: number) => {
      animId = requestAnimationFrame(render);

      if (!isVisibleRef.current || !isDocumentVisible) return;

      const isMobile = isMobileViewport();
      // Target FPS: 30 FPS on mobile to eliminate CPU/GPU throttling; 60 FPS on desktop
      const targetFps = isMobile ? 30 : 60;
      const frameInterval = 1000 / targetFps;
      const elapsed = now - lastFrameTime;

      if (elapsed < frameInterval) {
        return;
      }
      lastFrameTime = now - (elapsed % frameInterval);

      const p = propsRef.current;
      const delta = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      if (!p.paused) {
        flowAccum += delta * p.flowSpeed;
        churnAccum += delta * p.churnSpeed;
      }

      gl.useProgram(program);

      // On mobile screens under 6.5px blur, 8 layers & 3 detail iterations are visually indistinguishable
      // while cutting shader calculations by 60%. On desktop, keep full 12 layers & 5 detail iterations.
      const activeLayers = isMobile ? Math.min(8, p.layers) : p.layers;
      const activeDetail = isMobile ? Math.min(3, p.detail) : p.detail;

      gl.uniform2f(locResolution, canvas.width, canvas.height);
      gl.uniform1f(locFlow, flowAccum);
      gl.uniform1f(locChurn, churnAccum);
      gl.uniform1f(locLayers, Math.max(1, Math.min(15, activeLayers)));
      gl.uniform1f(locDetail, Math.max(1, Math.min(10, activeDetail)));
      gl.uniform1f(locTurbulence, Math.max(0, p.turbulence));
      gl.uniform1f(locZoom, Math.max(0.05, p.zoom));
      gl.uniform2f(locShift, p.shiftX, p.shiftY);
      gl.uniform1f(locRidgeFrequency, p.ridgeFrequency);
      gl.uniform1f(locRidgePhase, p.ridgePhase);
      gl.uniform1f(locDensity, Math.max(0.1, p.density));
      gl.uniform1f(locSwirl, p.swirl);
      gl.uniform1f(locExposure, Math.max(0, p.exposure));
      gl.uniform1f(locGain, Math.max(0, p.gain));

      const colA = hexToRgb(p.colorA);
      const colB = hexToRgb(p.colorB);
      const colC = hexToRgb(p.colorC);
      const colBg = hexToRgb(p.backgroundColor);

      gl.uniform3f(locColorA, colA[0], colA[1], colA[2]);
      gl.uniform3f(locColorB, colB[0], colB[1], colB[2]);
      gl.uniform3f(locColorC, colC[0], colC[1], colC[2]);
      gl.uniform3f(locBackground, colBg[0], colBg[1], colBg[2]);

      gl.uniform1f(locColorCycle, p.colorCycle);
      gl.uniform1f(locRotation, (p.rotation * Math.PI) / 180);
      gl.uniform1f(locGrain, Math.max(0, Math.min(2, p.grain)));
      gl.uniform1f(locOpacity, Math.max(0, Math.min(1, p.opacity)));
      gl.uniform1f(locInk, p.blend === "ink" ? 1.0 : 0.0);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    // Defer animation loop start by a short tick so initial page paint (FCP/LCP) finishes without contention
    const startTimer = setTimeout(() => {
      lastTime = performance.now();
      lastFrameTime = performance.now();
      animId = requestAnimationFrame(render);
    }, 50);

    return () => {
      clearTimeout(startTimer);
      cancelAnimationFrame(animId);
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      gl.deleteBuffer(vertexBuffer);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteProgram(program);
    };
  }, []);

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className || ""}`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block"
        style={{ width: "100%", height: "100%" }}
      />
      {children && <div className="relative z-10 h-full w-full">{children}</div>}
    </div>
  );
};
