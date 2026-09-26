import { GlowingRidges } from "@/components/ui/glowing-ridges";

interface BackgroundRidgesProps {
  opacity?: number;
}

export function BackgroundRidges({ opacity = 0.7 }: BackgroundRidgesProps) {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
    >
      <GlowingRidges
        className="w-full h-full"
        backgroundColor="#0a0c14"
        colorA="#1e3a8a"
        colorB="#cbdaf2"
        colorC="#6366f1"
        layers={10}
        detail={4}
        turbulence={0.55}
        zoom={1.15}
        shiftX={0.45}
        shiftY={0.5}
        ridgeFrequency={1.0}
        ridgePhase={2.0}
        density={10.0}
        flowSpeed={0.07}
        churnSpeed={0.6}
        swirl={14.0}
        exposure={0.22}
        gain={1.9}
        colorCycle={0.3}
        grain={0.15}
        opacity={opacity}
        blend="add"
        dpr={1}
      />
    </div>
  );
}
