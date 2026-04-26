import { Outlet, createRootRoute, HeadContent, Scripts, Link } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";
import { Header } from "@/components/wizard/Header";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="parchment max-w-md p-10 text-center">
        <h1 className="gold-text font-display text-6xl">404</h1>
        <p className="mt-4 italic text-muted-foreground">
          The scroll you seek has been lost to the ages.
        </p>
        <div className="mt-6">
          <Link to="/" className="spell-button primary inline-block">
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "CodePlus — The Code Wizard's Atelier" },
      {
        name: "description",
        content:
          "Summon a digital wizard to divine unused files, dependencies and exports from your repositories — and inscribe pull requests in a single ritual.",
      },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <AuthProvider>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
        <footer className="border-t border-[var(--gold-soft)] py-6 text-center font-display text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground">
          ✦ CodePlus · Bound by ancient scripts ✦
        </footer>
      </div>
      <Toaster />
    </AuthProvider>
  );
}
