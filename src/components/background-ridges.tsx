import { GlowingRidges } from "@/components/ui/glowing-ridges";

interface BackgroundRidgesProps {
  opacity?: number;
}

export function BackgroundRidges({ opacity = 0.85 }: BackgroundRidgesProps) {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
    >
      <GlowingRidges
        className="w-full h-full"
        backgroundColor="#000000"
        colorA="#ff6a2a"
        colorB="#22d3ee"
        colorC="#c026d3"
        layers={12}
        detail={5}
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
        dpr={1}
      />
    </div>
  );
}
