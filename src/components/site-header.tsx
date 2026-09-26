import { CardNav, type CardNavItem } from "./CardNav";

export function SiteHeader() {
  const items: CardNavItem[] = [
    {
      label: "Work",
      bgColor: "#141724",
      textColor: "#f8fafc",
      href: "/",
      links: [
        { label: "Selected Work" },
        { label: "All Projects" },
      ],
    },
    {
      label: "About",
      bgColor: "#191c2c",
      textColor: "#f8fafc",
      href: "/about",
      links: [
        { label: "About Marcell" },
        { label: "Workflow & Tools" },
      ],
    },
    {
      label: "Contact",
      bgColor: "#1e2235",
      textColor: "#f8fafc",
      copyText: "red.edits2244@gmail.com",
      links: [
        { label: "Email Me" },
        { label: "red.edits2244@gmail.com" },
      ],
    },
  ];

  return (
    <CardNav
      items={items}
      baseColor="#0e1017"
      menuColor="#f1f5f9"
      theme="dark"
    />
  );
}

export { CardNav };
