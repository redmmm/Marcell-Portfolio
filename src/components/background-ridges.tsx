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
        backgroundColor="#080a10"
        colorA="#38bdf8"
        colorB="#cbdaf2"
        colorC="#818cf8"
        layers={10}
        turbulence={0.6}
        zoom={1.1}
        shiftX={0.45}
        shiftY={0.5}
        ridgeFrequency={1.0}
        ridgePhase={2.0}
        density={10.0}
        flowSpeed={0.08}
        churnSpeed={0.8}
        swirl={14.0}
        exposure={0.45}
        gain={1.8}
        colorCycle={0.35}
        grain={0.12}
        opacity={opacity}
        dpr={1}
      />
    </div>
  );
}
