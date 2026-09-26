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
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

// Pure GLSL ES 1.00 compliant fragment shader (fully compatible with WebGL 1 & 2 across all browsers including Firefox/Zen)
const FRAGMENT_SHADER = `
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_layers;
uniform float u_turbulence;
uniform float u_zoom;
uniform vec2 u_shift;
uniform float u_ridgeFrequency;
uniform float u_ridgePhase;
uniform float u_density;
uniform float u_flowSpeed;
uniform float u_churnSpeed;
uniform float u_swirl;
uniform float u_exposure;
uniform float u_gain;
uniform float u_colorCycle;
uniform float u_rotation;
uniform float u_grain;
uniform float u_opacity;
uniform vec3 u_colorA;
uniform vec3 u_colorB;
uniform vec3 u_colorC;
uniform vec3 u_bgColor;

// 2D Rotation
vec2 rotate2D(vec2 p, float rad) {
  float c = cos(rad);
  float s = sin(rad);
  return vec2(p.x * c - p.y * s, p.x * s + p.y * c);
}

// Pseudo-random hash
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

// Value noise
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// Fixed 4-octave silk turbulence (no non-constant loop breaks for 100% WebGL compatibility)
float silkTurbulence(vec2 p, float churnTime) {
  float v = 0.500 * vnoise(p * 1.00 + vec2(churnTime * 0.15, -churnTime * 0.10));
  v += 0.260 * vnoise(p * 2.02 + vec2(churnTime * 0.20, -churnTime * 0.15));
  v += 0.135 * vnoise(p * 4.08 + vec2(churnTime * 0.25, -churnTime * 0.20));
  v += 0.070 * vnoise(p * 8.24 + vec2(churnTime * 0.30, -churnTime * 0.25));
  return v;
}

// 3-point iridescent palette
vec3 getIridescentPalette(float t) {
  float phase = fract(t);
  if (phase < 0.333) {
    return mix(u_colorA, u_colorB, smoothstep(0.0, 0.333, phase));
  } else if (phase < 0.666) {
    return mix(u_colorB, u_colorC, smoothstep(0.333, 0.666, phase));
  } else {
    return mix(u_colorC, u_colorA, smoothstep(0.666, 1.0, phase));
  }
}

void main() {
  vec2 res = max(u_resolution, vec2(10.0, 10.0));
  vec2 uv = (gl_FragCoord.xy - 0.5 * res) / min(res.x, res.y);

  // Apply rotation, zoom and shift
  float rad = u_rotation * 0.0174532925;
  uv = rotate2D(uv, rad);
  uv = uv * u_zoom + u_shift;

  float flowTime = u_time * u_flowSpeed;
  float churnTime = u_time * u_churnSpeed;

  // Swirl center distortion
  float dist = length(uv);
  float swirlAngle = dist * (u_swirl * 0.15) - flowTime * 0.5;
  vec2 swirledUV = rotate2D(uv, swirlAngle * u_turbulence);

  vec3 accumFilm = vec3(0.0);
  float totalWeight = 0.0;

  // 10 fixed iterations with dynamic alpha masking
  for (int i = 0; i < 10; i++) {
    float layerIdx = float(i);
    float layerNorm = layerIdx / max(u_layers, 1.0);
    float layerPhase = layerNorm * 6.283185;
    float activeMask = step(layerIdx, u_layers - 0.5);

    // Layer-specific warped flow coordinate
    vec2 p = swirledUV * u_density;
    p.y += sin(p.x * 0.6 + layerPhase + flowTime) * (u_turbulence * 1.4);
    p.x += cos(p.y * 0.7 - layerPhase * 0.5 + flowTime * 0.8) * (u_turbulence * 1.1);

    // Turbulence modulation
    float turb = silkTurbulence(p, churnTime + layerPhase);
    p += turb * (u_turbulence * 1.6);

    // Folded silk ridge wave profile
    float wave1 = sin(p.x * u_ridgeFrequency + p.y * 0.75 + layerPhase + u_ridgePhase);
    float wave2 = cos(p.y * (u_ridgeFrequency * 1.35) - p.x * 0.55 + flowTime * 1.1);
    float composite = wave1 * 0.65 + wave2 * 0.35;

    // Sharp raked light crest
    float ridge = 1.0 - abs(composite);
    ridge = pow(clamp(ridge, 0.0, 1.0), 3.0);

    // Silk specular highlight
    float sheen = pow(clamp(ridge, 0.0, 1.0), 5.0) * 1.5;

    // Iridescent color cycle
    float colorOffset = fract(layerNorm * 0.6 + composite * 0.2 + u_time * (u_colorCycle * 0.08));
    vec3 layerColor = getIridescentPalette(colorOffset);

    // Add sheen brightness to layer
    layerColor = mix(layerColor, vec3(1.0), sheen * 0.4);

    float layerWeight = (ridge * 0.9 + sheen * 1.2) * activeMask;
    accumFilm += layerColor * layerWeight;
    totalWeight += activeMask;
  }

  // Normalize
  vec3 color = accumFilm / max(totalWeight * 0.15, 0.001);

  // Filmic exposure and tone mapping
  color = color / (vec3(1.0) + color * 0.4);
  color *= (u_exposure * 4.0);
  color = pow(clamp(color, 0.0, 1.0), vec3(1.0 / max(u_gain, 0.1)));

  // Film grain
  if (u_grain > 0.0) {
    float noise = (hash(gl_FragCoord.xy + fract(u_time * 17.31) * 100.0) - 0.5) * u_grain * 0.1;
    color += noise;
  }

  // Composite with dark background
  float brightness = clamp(dot(color, vec3(0.333)), 0.0, 1.0);
  vec3 finalColor = u_bgColor + color * u_opacity;
  finalColor = mix(finalColor, color, brightness * 0.35);

  gl_FragColor = vec4(clamp(finalColor, 0.0, 1.0), 1.0);
}
`;

export function GlowingRidges({
  layers = 10,
  detail = 4,
  turbulence = 0.6,
  zoom = 1.1,
  shiftX = 0.45,
  shiftY = 0.5,
  ridgeFrequency = 1.0,
  ridgePhase = 2.0,
  density = 10.0,
  flowSpeed = 0.08,
  churnSpeed = 0.8,
  swirl = 14.0,
  exposure = 0.4,
  gain = 1.8,
  colorCycle = 0.35,
  rotation = 0.0,
  grain = 0.15,
  opacity = 0.85,
  colorA = "#38bdf8",
  colorB = "#cbdaf2",
  colorC = "#818cf8",
  backgroundColor = "#0a0c14",
  paused = false,
  dpr = 1,
  className = "",
  children,
}: GlowingRidgesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const gl =
      canvas.getContext("webgl", {
        alpha: false,
        antialias: false,
        powerPreference: "low-power",
      }) ||
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);

    if (!gl) {
      console.warn("[GlowingRidges] WebGL not supported");
      return;
    }

    function createShader(type: number, source: string) {
      const shader = gl!.createShader(type);
      if (!shader) return null;
      gl!.shaderSource(shader, source);
      gl!.compileShader(shader);
      if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
        console.error("[GlowingRidges] Shader compile error:", gl!.getShaderInfoLog(shader));
        gl!.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vs = createShader(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = createShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("[GlowingRidges] Program link error:", gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Fullscreen quad buffer
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const aPosition = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    // Uniform locations
    const uResolution = gl.getUniformLocation(program, "u_resolution");
    const uTime = gl.getUniformLocation(program, "u_time");
    const uLayers = gl.getUniformLocation(program, "u_layers");
    const uTurbulence = gl.getUniformLocation(program, "u_turbulence");
    const uZoom = gl.getUniformLocation(program, "u_zoom");
    const uShift = gl.getUniformLocation(program, "u_shift");
    const uRidgeFrequency = gl.getUniformLocation(program, "u_ridgeFrequency");
    const uRidgePhase = gl.getUniformLocation(program, "u_ridgePhase");
    const uDensity = gl.getUniformLocation(program, "u_density");
    const uFlowSpeed = gl.getUniformLocation(program, "u_flowSpeed");
    const uChurnSpeed = gl.getUniformLocation(program, "u_churnSpeed");
    const uSwirl = gl.getUniformLocation(program, "u_swirl");
    const uExposure = gl.getUniformLocation(program, "u_exposure");
    const uGain = gl.getUniformLocation(program, "u_gain");
    const uColorCycle = gl.getUniformLocation(program, "u_colorCycle");
    const uRotation = gl.getUniformLocation(program, "u_rotation");
    const uGrain = gl.getUniformLocation(program, "u_grain");
    const uOpacity = gl.getUniformLocation(program, "u_opacity");
    const uColorA = gl.getUniformLocation(program, "u_colorA");
    const uColorB = gl.getUniformLocation(program, "u_colorB");
    const uColorC = gl.getUniformLocation(program, "u_colorC");
    const uBgColor = gl.getUniformLocation(program, "u_bgColor");

    function resize() {
      if (!canvas || !container || !gl) return;
      const rect = container.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, dpr);
      const w = Math.max(10, Math.floor((rect.width || window.innerWidth) * pixelRatio));
      const h = Math.max(10, Math.floor((rect.height || window.innerHeight) * pixelRatio));

      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
    }

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    window.addEventListener("resize", resize);

    const startTime = performance.now();
    let lastRenderTime = 0;

    function render(now: number) {
      if (!gl || !program || !canvas) return;

      const elapsed = !paused ? (now - startTime) * 0.001 : lastRenderTime;
      lastRenderTime = elapsed;

      gl.useProgram(program);

      const w = canvas.width || window.innerWidth || 800;
      const h = canvas.height || window.innerHeight || 600;

      gl.uniform2f(uResolution, w, h);
      gl.uniform1f(uTime, elapsed);
      gl.uniform1f(uLayers, Math.min(10.0, Math.max(1.0, layers)));
      gl.uniform1f(uTurbulence, turbulence);
      gl.uniform1f(uZoom, zoom);
      gl.uniform2f(uShift, shiftX - 0.5, shiftY - 0.5);
      gl.uniform1f(uRidgeFrequency, ridgeFrequency);
      gl.uniform1f(uRidgePhase, ridgePhase);
      gl.uniform1f(uDensity, density);
      gl.uniform1f(uFlowSpeed, flowSpeed);
      gl.uniform1f(uChurnSpeed, churnSpeed);
      gl.uniform1f(uSwirl, swirl);
      gl.uniform1f(uExposure, exposure);
      gl.uniform1f(uGain, gain);
      gl.uniform1f(uColorCycle, colorCycle);
      gl.uniform1f(uRotation, rotation);
      gl.uniform1f(uGrain, grain);
      gl.uniform1f(uOpacity, opacity);

      const rgbA = hexToRgb(colorA);
      const rgbB = hexToRgb(colorB);
      const rgbC = hexToRgb(colorC);
      const rgbBg = hexToRgb(backgroundColor);

      gl.uniform3f(uColorA, rgbA[0], rgbA[1], rgbA[2]);
      gl.uniform3f(uColorB, rgbB[0], rgbB[1], rgbB[2]);
      gl.uniform3f(uColorC, rgbC[0], rgbC[1], rgbC[2]);
      gl.uniform3f(uBgColor, rgbBg[0], rgbBg[1], rgbBg[2]);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animFrameRef.current = requestAnimationFrame(render);
    }

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      resizeObserver.disconnect();
      window.removeEventListener("resize", resize);
      if (gl) {
        gl.deleteBuffer(positionBuffer);
        gl.deleteProgram(program);
        gl.deleteShader(vs);
        gl.deleteShader(fs);
      }
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
    colorCycle,
    rotation,
    grain,
    opacity,
    colorA,
    colorB,
    colorC,
    backgroundColor,
    paused,
    dpr,
  ]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden ${className}`}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ display: "block", width: "100%", height: "100%" }}
      />
      {children && <div className="relative z-10 w-full h-full">{children}</div>}
    </div>
  );
}
