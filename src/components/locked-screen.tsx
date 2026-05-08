export function LockedScreen() {
  return (
    <div className="min-h-dvh flex items-center justify-center px-6 bg-background animate-fade-in">
      <div className="text-center">
        <div className="mb-8 inline-flex h-14 w-14 items-center justify-center rounded-full glass">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        </div>
        <h1 className="font-serif text-4xl md:text-6xl tracking-tight text-foreground mb-4">
          The site is locked.
        </h1>
        <p className="text-muted-foreground text-sm tracking-wide uppercase">
          Please check back soon
        </p>
      </div>
    </div>
  );
}
