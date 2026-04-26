import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ScrollCard } from "@/components/wizard/ScrollCard";
import { WizardInput } from "@/components/wizard/WizardInput";
import { SpellButton } from "@/components/wizard/SpellButton";
import { startAnalysis } from "@/services/api/codeplus";
import { extractError } from "@/services/api/client";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Atelier — CodePlus" },
      {
        name: "description",
        content: "Summon a divination upon a repository.",
      },
    ],
  }),
  component: DashboardPage,
});

interface FormValues {
  repoLink: string;
  userType: string;
}

const USER_TYPES = [
  { value: "developer", label: "Developer" },
  { value: "maintainer", label: "Maintainer" },
  { value: "reviewer", label: "Reviewer" },
  { value: "auditor", label: "Auditor" },
];

function DashboardPage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { repoLink: "", userType: "developer" },
  });

  const onSubmit = async (v: FormValues) => {
    try {
      const analysis = await startAnalysis(v.repoLink.trim(), v.userType);
      if (!analysis?.id) {
        toast.error("The spell returned no scroll id.");
        return;
      }
      toast.success("Divination begun.");
      navigate({
        to: "/analysis/$analysisId",
        params: { analysisId: String(analysis.id) },
      });
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <ScrollCard
        title="Summon a Divination"
        subtitle="Offer the relic — a repository link — and choose your station."
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <WizardInput
            label="Repository link"
            placeholder="https://github.com/owner/name"
            autoComplete="off"
            spellCheck={false}
            error={errors.repoLink?.message}
            {...register("repoLink", {
              required: "A repository link is required",
              pattern: {
                value: /^https?:\/\/.+/i,
                message: "Must be a valid URL",
              },
            })}
          />

          <div className="space-y-2">
            <label
              htmlFor="userType"
              className="font-display text-xs uppercase tracking-[0.2em] text-gold"
            >
              Your station
            </label>
            <select
              id="userType"
              className="wizard-input"
              {...register("userType", { required: "Choose a station" })}
            >
              {USER_TYPES.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
            {errors.userType?.message && (
              <p className="text-sm italic text-destructive">
                {errors.userType.message}
              </p>
            )}
          </div>

          <SpellButton
            type="submit"
            variant="primary"
            loading={isSubmitting}
            className="w-full"
          >
            Begin Divination
          </SpellButton>
        </form>
      </ScrollCard>

      <div className="mt-10 text-center font-display text-[0.7rem] uppercase tracking-[0.3em] text-muted-foreground">
        ✦ The wizard sees only what your token permits ✦
      </div>
    </div>
  );
}
