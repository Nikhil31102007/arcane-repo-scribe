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
  { value: "developer",  label: "Developer"  },
  { value: "maintainer", label: "Maintainer" },
  { value: "reviewer",   label: "Reviewer"   },
  { value: "auditor",    label: "Auditor"    },
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
      toast.success("Divination begun — the wizard is consulting the codex.");
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
        subtitle="Offer the relic — a public GitHub repository — and choose your station."
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <WizardInput
            label="Repository URL"
            placeholder="https://github.com/owner/repo"
            autoComplete="off"
            spellCheck={false}
            error={errors.repoLink?.message}
            {...register("repoLink", {
              required: "A repository URL is required",
              pattern: {
                value: /^https?:\/\/(www\.)?github\.com\/[^\s/]+\/[^\s/]+/i,
                message: "Must be a valid GitHub URL (https://github.com/owner/repo)",
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
              <p className="text-sm italic text-destructive">{errors.userType.message}</p>
            )}
          </div>

          <SpellButton
            type="submit"
            variant="primary"
            loading={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? "Consulting the archives…" : "Begin Divination"}
          </SpellButton>
        </form>
      </ScrollCard>

      {/* What happens explanation */}
      <div className="mt-8 space-y-0">
        <div className="border border-[var(--gold-soft)] bg-[oklch(0.18_0.014_65_/_0.4)]">
          <div className="border-b border-[var(--gold-soft)] px-6 py-3 font-display text-[0.7rem] uppercase tracking-[0.25em] text-gold">
            How it works
          </div>
          <ol className="divide-y divide-[var(--gold-soft)]">
            {[
              ["Clone",    "The wizard clones your public repository."],
              ["Analyse",  "Unused files, dependencies, and exports are divined."],
              ["Select",   "You choose which items to remove."],
              ["PR",       "A clean pull request is forged automatically."],
            ].map(([step, desc]) => (
              <li key={step} className="flex items-start gap-4 px-6 py-3">
                <span className="mt-0.5 shrink-0 font-display text-[0.65rem] uppercase tracking-[0.2em] text-gold">
                  {step}
                </span>
                <span className="text-sm italic text-muted-foreground">{desc}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="mt-10 text-center font-display text-[0.7rem] uppercase tracking-[0.3em] text-muted-foreground">
        ✦ The wizard sees only what your token permits ✦
      </div>
    </div>
  );
}