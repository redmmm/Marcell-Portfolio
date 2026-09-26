import { GlowingRidges } from "@/components/ui/glowing-ridges";

interface BackgroundRidgesProps {
  opacity?: number;
}

export function BackgroundRidges({ opacity = 0.8 }: BackgroundRidgesProps) {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
    >
      <GlowingRidges
        className="w-full h-full"
        backgroundColor="#08090e"
        colorA="#00d4ff"
        colorB="#cbdaf2"
        colorC="#818cf8"
        layers={8}
        detail={4}
        turbulence={0.55}
        zoom={1.1}
        shiftX={0.45}
        shiftY={0.45}
        ridgeFrequency={1.0}
        ridgePhase={2.0}
        density={8.5}
        flowSpeed={0.06}
        churnSpeed={0.6}
        swirl={12.0}
        exposure={0.65}
        gain={1.5}
        colorCycle={0.25}
        grain={0.12}
        opacity={opacity}
        dpr={1}
      />
    </div>
  );
}
