import { Link } from "@tanstack/react-router";

export function SiteHeader() {
  return (
    <header className="fixed top-0 inset-x-0 z-40 px-6 py-4">
      <div className="mx-auto max-w-7xl flex items-center justify-between glass rounded-full px-6 py-3 shadow-elegant">
        <Link
          to="/"
          className="font-serif text-xl tracking-tight text-primary"
        >
          Marcell's Portfolio
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            to="/"
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-full"
            activeProps={{ className: "px-4 py-2 text-sm text-foreground rounded-full" }}
            activeOptions={{ exact: true }}
          >
            Work
          </Link>
          <Link
            to="/about"
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-full"
            activeProps={{ className: "px-4 py-2 text-sm text-foreground rounded-full" }}
          >
            About
          </Link>
          <a
            href="mailto:hello@example.com"
            className="ml-2 px-4 py-2 text-sm rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Contact
          </a>
        </nav>
      </div>
    </header>
  );
}
