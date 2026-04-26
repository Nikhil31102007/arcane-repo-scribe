import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { ScrollCard } from "@/components/wizard/ScrollCard";
import { WizardInput } from "@/components/wizard/WizardInput";
import { SpellButton } from "@/components/wizard/SpellButton";
import { extractError } from "@/services/api/client";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — CodePlus" },
      { name: "description", content: "Sign into the CodePlus wizard's atelier." },
    ],
  }),
  component: LoginPage,
});

interface FormValues {
  username: string;
  password: string;
}

function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues: { username: "", password: "" } });

  useEffect(() => {
    if (isAuthenticated) navigate({ to: "/" });
  }, [isAuthenticated, navigate]);

  const onSubmit = async (values: FormValues) => {
    try {
      await login(values.username.trim(), values.password);
      toast.success("Welcome back, mage.");
      navigate({ to: "/" });
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <ScrollCard
        title="Enter the Atelier"
        subtitle="Speak the words of binding."
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <WizardInput
            label="Username"
            placeholder="archmage_42"
            autoComplete="username"
            error={errors.username?.message}
            {...register("username", {
              required: "A name is required",
              minLength: { value: 3, message: "At least 3 runes" },
            })}
          />
          <WizardInput
            label="Password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register("password", { required: "The seal is required" })}
          />
          <SpellButton
            type="submit"
            variant="primary"
            loading={isSubmitting}
            className="w-full"
          >
            Cast Sign-In
          </SpellButton>
        </form>
        <p className="mt-6 text-center text-sm italic text-muted-foreground">
          New to the order?{" "}
          <Link to="/register" className="text-gold hover:underline">
            Inscribe your name
          </Link>
        </p>
      </ScrollCard>
    </div>
  );
}
