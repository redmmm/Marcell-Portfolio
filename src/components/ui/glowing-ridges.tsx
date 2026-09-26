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

const FRAGMENT_SHADER = `
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform int u_layers;
uniform int u_detail;
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
uniform int u_blend; // 0: add, 1: ink

// 2D Rotation
vec2 rotate(vec2 p, float rad) {
  float c = cos(rad);
  float s = sin(rad);
  return vec2(p.x * c - p.y * s, p.x * s + p.y * c);
}

// Pseudo-random hash for noise and grain
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

// 2D Value Noise
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

// Multi-octave silk turbulence
float silkTurbulence(vec2 p, float churnTime, int octaves) {
  float value = 0.0;
  float amplitude = 0.5;
  float freq = 1.0;
  for (int o = 0; o < 8; o++) {
    if (o >= octaves) break;
    value += amplitude * vnoise(p * freq + vec2(churnTime * 0.15, -churnTime * 0.1));
    freq *= 2.02;
    amplitude *= 0.52;
  }
  return value;
}

// Iridescent palette interpolation
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
  vec2 st = gl_FragCoord.xy / u_resolution.xy;
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);

  // Apply rotation, zoom and shift
  float rad = u_rotation * 0.0174532925;
  uv = rotate(uv, rad);
  uv = uv * u_zoom + u_shift;

  float flowTime = u_time * u_flowSpeed;
  float churnTime = u_time * u_churnSpeed;

  vec3 accumFilm = vec3(0.0);
  float totalWeight = 0.0;

  // Swirl center distortion
  float dist = length(uv);
  float swirlAngle = dist * (u_swirl * 0.2) - flowTime * 0.6;
  vec2 swirledUV = rotate(uv, swirlAngle * u_turbulence);

  for (int i = 0; i < 15; i++) {
    if (i >= u_layers) break;

    float layerNorm = float(i) / float(max(u_layers, 1));
    float layerPhase = layerNorm * 6.283185;

    // Layer-specific warped flow coordinate
    vec2 p = swirledUV * u_density;
    p.y += sin(p.x * 0.6 + layerPhase + flowTime) * u_turbulence * 1.5;
    p.x += cos(p.y * 0.7 - layerPhase * 0.5 + flowTime * 0.8) * u_turbulence * 1.2;

    // Turbulence modulation
    float turb = silkTurbulence(p, churnTime + layerPhase, u_detail);
    p += turb * (u_turbulence * 1.8);

    // Ridge generation: folded silk wave profile
    float wave = sin(p.x * u_ridgeFrequency + p.y * 0.8 + layerPhase + u_ridgePhase);
    float wave2 = cos(p.y * (u_ridgeFrequency * 1.3) - p.x * 0.5 + flowTime * 1.2);
    float composite = wave * 0.65 + wave2 * 0.35;

    // Sharp raking light ridge highlight
    float ridge = 1.0 - abs(composite);
    ridge = pow(clamp(ridge, 0.0, 1.0), 3.5);

    // Fresnel / anisotropic silk sheen
    float sheen = pow(clamp(ridge + turb * 0.4, 0.0, 1.0), 5.0) * 0.7;

    // Color cycle across stacked layers
    float colorOffset = fract(layerNorm + u_time * (u_colorCycle * 0.05) + ridge * 0.15);
    vec3 layerColor = getIridescentPalette(colorOffset);

    // Add sheen tinting
    layerColor += vec3(sheen * 0.4);

    float layerWeight = ridge * (1.0 + sheen);
    accumFilm += layerColor * layerWeight;
    totalWeight += 1.0;
  }

  // Normalize and apply exposure
  vec3 color = accumFilm / max(totalWeight * 0.18, 0.001);
  color = vec3(1.0) - exp(-color * u_exposure * 4.5);

  // Gain / gamma curve
  color = pow(clamp(color, 0.0, 1.0), vec3(1.0 / max(u_gain, 0.01)));

  // Film grain
  if (u_grain > 0.0) {
    float noise = (hash(gl_FragCoord.xy + vec2(u_time * 91.13, u_time * 47.71)) - 0.5) * u_grain;
    color += noise;
  }

  // Composite with background
  vec3 finalColor;
  if (u_blend == 0) {
    // Additive
    finalColor = u_bgColor + color * u_opacity;
  } else {
    // Ink
    finalColor = mix(u_bgColor, color, u_opacity);
  }

  gl_FragColor = vec4(clamp(finalColor, 0.0, 1.0), 1.0);
}
`;

export function GlowingRidges({
  layers = 12,
  detail = 5,
  turbulence = 0.6,
  zoom = 1.1,
  shiftX = 0.45,
  shiftY = 0.5,
  ridgeFrequency = 1.0,
  ridgePhase = 2.0,
  density = 11.0,
  flowSpeed = 0.1,
  churnSpeed = 1.0,
  swirl = 16.0,
  exposure = 0.25,
  gain = 2.0,
  colorCycle = 0.4,
  rotation = 0.0,
  grain = 0.25,
  opacity = 0.75,
  colorA = "#ff6a2a",
  colorB = "#22d3ee",
  colorC = "#c026d3",
  backgroundColor = "#000000",
  blend = "add",
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
      console.warn("WebGL not supported for GlowingRidges");
      return;
    }

    // Compile Shader helper
    function createShader(type: number, source: string) {
      const shader = gl!.createShader(type);
      if (!shader) return null;
      gl!.shaderSource(shader, source);
      gl!.compileShader(shader);
      if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
        console.error("Shader compile error:", gl!.getShaderInfoLog(shader));
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
      console.error("Program link error:", gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Quad geometry (-1 to 1)
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
    const uDetail = gl.getUniformLocation(program, "u_detail");
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
    const uBlend = gl.getUniformLocation(program, "u_blend");

    let width = 0;
    let height = 0;

    function handleResize() {
      if (!container || !canvas || !gl) return;
      const rect = container.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, dpr);
      const w = Math.max(1, Math.floor(rect.width * pixelRatio));
      const h = Math.max(1, Math.floor(rect.height * pixelRatio));

      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        width = w;
        height = h;
        gl.viewport(0, 0, w, h);
      }
    }

    handleResize();
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    let startTime = performance.now();
    let currentElapsed = 0;

    function render(now: number) {
      if (!gl || !program) return;

      if (!paused) {
        currentElapsed = (now - startTime) * 0.001;
      }

      gl.useProgram(program);

      // Uniform updates
      gl.uniform2f(uResolution, width, height);
      gl.uniform1f(uTime, currentElapsed);
      gl.uniform1i(uLayers, Math.min(15, Math.max(1, layers)));
      gl.uniform1i(uDetail, Math.min(8, Math.max(1, detail)));
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
      gl.uniform1i(uBlend, blend === "ink" ? 1 : 0);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animFrameRef.current = requestAnimationFrame(render);
    }

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      resizeObserver.disconnect();
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
    blend,
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
        style={{ display: "block" }}
      />
      {children && <div className="relative z-10 w-full h-full">{children}</div>}
    </div>
  );
}
