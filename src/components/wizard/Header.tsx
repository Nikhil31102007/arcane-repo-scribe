import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/context/AuthContext";

export function Header() {
  const { isAuthenticated, username, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  return (
    <header className="border-b border-[var(--gold-soft)] bg-[oklch(0.14_0.012_60_/_0.6)] backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link to="/" className="group flex items-center gap-3">
          <span
            className="font-display text-2xl text-gold"
            style={{ textShadow: "0 0 18px var(--gold-glow)" }}
          >
            ✦
          </span>
          <span className="font-display text-lg uppercase tracking-[0.3em] text-foreground">
            Code<span className="text-gold">Plus</span>
          </span>
        </Link>

        <nav className="flex items-center gap-6 font-display text-xs uppercase tracking-[0.2em]">
          {isAuthenticated ? (
            <>
              <Link
                to="/"
                className="text-muted-foreground hover:text-gold"
                activeProps={{ style: { color: "var(--gold)" } }}
                activeOptions={{ exact: true }}
              >
                Dashboard
              </Link>
              {username && (
                <span className="hidden text-muted-foreground md:inline">
                  {username}
                </span>
              )}
              <button
                onClick={handleLogout}
                className="text-muted-foreground transition-colors hover:text-gold"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-muted-foreground hover:text-gold"
                activeProps={{ style: { color: "var(--gold)" } }}
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="text-muted-foreground hover:text-gold"
                activeProps={{ style: { color: "var(--gold)" } }}
              >
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
