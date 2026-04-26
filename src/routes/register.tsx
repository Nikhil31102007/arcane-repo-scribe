import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { ScrollCard } from "@/components/wizard/ScrollCard";
import { WizardInput } from "@/components/wizard/WizardInput";
import { SpellButton } from "@/components/wizard/SpellButton";
import { extractError } from "@/services/api/client";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Register — CodePlus" },
      { name: "description", content: "Inscribe your name into the CodePlus order." },
    ],
  }),
  component: RegisterPage,
});

interface FormValues {
  username: string;
  password: string;
  confirm: string;
}

function RegisterPage() {
  const { register: registerUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { username: "", password: "", confirm: "" },
  });

  useEffect(() => {
    if (isAuthenticated) navigate({ to: "/" });
  }, [isAuthenticated, navigate]);

  const onSubmit = async (v: FormValues) => {
    try {
      await registerUser(v.username.trim(), v.password);
      toast.success("Your name is bound to the codex.");
      navigate({ to: "/" });
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <ScrollCard title="Inscribe Your Name" subtitle="Forge a binding of your own.">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <WizardInput
            label="Username"
            placeholder="archmage_42"
            autoComplete="username"
            error={errors.username?.message}
            {...register("username", {
              required: "A name is required",
              minLength: { value: 3, message: "At least 3 runes" },
              maxLength: { value: 64, message: "No more than 64 runes" },
            })}
          />
          <WizardInput
            label="Password"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register("password", {
              required: "The seal is required",
              minLength: { value: 8, message: "At least 8 characters" },
            })}
          />
          <WizardInput
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            error={errors.confirm?.message}
            {...register("confirm", {
              required: "Confirm the seal",
              validate: (val) =>
                val === watch("password") || "The seals do not match",
            })}
          />
          <SpellButton
            type="submit"
            variant="primary"
            loading={isSubmitting}
            className="w-full"
          >
            Forge Account
          </SpellButton>
        </form>
        <p className="mt-6 text-center text-sm italic text-muted-foreground">
          Already bound?{" "}
          <Link to="/login" className="text-gold hover:underline">
            Sign in
          </Link>
        </p>
      </ScrollCard>
    </div>
  );
}
