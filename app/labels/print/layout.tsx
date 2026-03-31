// Pfad: src/app/labels/print/layout.tsx
// Dieses Layout überschreibt das Root-Layout komplett
// damit die Druckseite ihr eigenes <html> und <body> definieren kann

export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return children;
}