import { Link, useLocation } from "@tanstack/react-router";

export function SiteHeader() {
  const { pathname } = useLocation();

  const linkBase =
    "px-4 py-2 text-sm rounded-full transition-all duration-300";
  const activeClass =
    "bg-[#cbdaf2] text-black font-medium";
  const inactiveClass =
    "text-gray-300 hover:text-white";

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
            className={`${linkBase} ${pathname === "/" ? activeClass : inactiveClass}`}
          >
            Work
          </Link>
          <Link
            to="/about"
            className={`${linkBase} ${pathname === "/about" ? activeClass : inactiveClass}`}
          >
            About
          </Link>
          <a
            href="mailto:red.edits2244@gmail.com"
            className={`${linkBase} ${inactiveClass}`}
          >
            Contact
          </a>
        </nav>
      </div>
    </header>
  );
}
