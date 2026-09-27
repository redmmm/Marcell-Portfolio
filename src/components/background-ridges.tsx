import { GlowingRidges } from "@/components/ui/glowing-ridges";

interface BackgroundRidgesProps {
  opacity?: number;
  blur?: number;
  className?: string;
}

export function BackgroundRidges({
  opacity = 0.85,
  blur = 6.5,
  className = "",
}: BackgroundRidgesProps) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none overflow-hidden ${className}`}
      style={{
        WebkitMaskImage:
          "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 38%, rgba(0,0,0,0.4) 68%, rgba(0,0,0,0) 96%)",
        maskImage:
          "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 38%, rgba(0,0,0,0.4) 68%, rgba(0,0,0,0) 96%)",
      }}
    >
      <div
        className="w-full h-full scale-[1.05]"
        style={{
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
          mixBlendMode: "screen",
        }}
      >
        <GlowingRidges
          className="w-full h-full"
          backgroundColor="#000000"
          colorA="#ff6a2a"
          colorB="#22d3ee"
          colorC="#c026d3"
          layers={10}
          detail={4}
          turbulence={0.6}
          zoom={1.1}
          shiftX={0.45}
          shiftY={0.5}
          ridgeFrequency={1.0}
          ridgePhase={2.0}
          density={11.0}
          flowSpeed={0.06}
          churnSpeed={0.3}
          swirl={16.0}
          exposure={0.25}
          gain={2.0}
          colorCycle={0.4}
          rotation={0}
          grain={0.15}
          opacity={opacity}
          blend="add"
          dpr={0.75}
        />
      </div>
    </div>
  );
}
