import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Loader } from "@/components/wizard/Loader";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { isAuthenticated, isBootstrapping } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isBootstrapping && !isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [isAuthenticated, isBootstrapping, navigate]);

  if (isBootstrapping || !isAuthenticated) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <Loader label="Consulting the archives" />
      </div>
    );
  }

  return <Outlet />;
}
