import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/_core/hooks/useAuth";
import { authStore } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { mockStore } from "@/mock/store";
import { clearPendingInput } from "@/pages/Verify";
import { toast } from "sonner";
import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="panel p-6">
      <p className="font-serif text-base font-semibold text-[hsl(var(--foreground))]">{title}</p>
      {description && (
        <p className="mt-1 text-sm leading-relaxed text-[hsl(var(--muted))]">{description}</p>
      )}
      <div className="mt-5">{children}</div>
    </div>
  );
}

function RetentionOption({
  label,
  detail,
  selected,
  onClick,
}: {
  label: string;
  detail: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "w-full rounded-lg border px-4 py-3 text-left transition-all " +
        (selected
          ? "border-[hsl(var(--foreground))] bg-[hsl(var(--secondary))] shadow-[0_1px_2px_rgba(16,24,40,0.06),0_8px_20px_-6px_rgba(16,24,40,0.12),0_20px_40px_-12px_rgba(16,24,40,0.14)]"
          : "border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-[0_1px_2px_rgba(16,24,40,0.06),0_4px_10px_-4px_rgba(16,24,40,0.10)] hover:bg-[hsl(var(--secondary))/40]")
      }
    >
      <p className="text-sm font-medium text-[hsl(var(--foreground))]">{label}</p>
      <p className="mt-0.5 text-xs text-[hsl(var(--muted))]">{detail}</p>
    </button>
  );
}

export default function Settings() {
  const { user, isGuest, logout } = useAuth();
  const { theme, toggleTheme, switchable } = useTheme();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [publicProfile, setPublicProfile] = useState(true);
  const [shareReports, setShareReports] = useState(true);
  const [retention, setRetention] = useState("none");

  return (
    <AppShell>
      <div className="relative z-10">
          <div className="settings-page container max-w-3xl py-10 md:py-14">
        <div className="fade-in text-center">
          <p className="section-label eyebrow-glow">Preferences</p>
          <h1 className="section-title-glow mt-3 text-balance text-3xl dark:text-4xl md:text-4xl md:dark:text-5xl">Settings</h1>
          <p className="mx-auto mt-3 max-w-xl text-[hsl(var(--muted))]">
            Your profile, privacy and data controls.
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {/* Appearance */}
          <Section
            title="Appearance"
            description="Choose how Visstya looks for you."
          >
            {switchable && toggleTheme ? (
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[hsl(var(--foreground))]">
                    {theme === "dark" ? "Dark mode" : "Light mode"}
                  </p>
                  <p className="text-xs text-[hsl(var(--muted))]">
                    Toggle between dark and light appearance.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={toggleTheme}
                  aria-label="Toggle dark mode"
                >
                  {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[hsl(var(--foreground))]">Dark mode</p>
                  <p className="text-xs text-[hsl(var(--muted))]">Theme switching is disabled.</p>
                </div>
                <Switch checked={false} disabled />
              </div>
            )}
          </Section>

          {/* Profile */}
          <Section
            title="Profile"
            description={
              isGuest
                ? "You're browsing as a guest. Add a name and email to keep your profile on this device."
                : "How you appear across Visstya."
            }
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="s-name" className="mb-1.5 block text-sm font-medium text-[hsl(var(--foreground))]">
                  Name
                </label>
                <input
                  id="s-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-10 w-full rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--card))] px-3 text-sm outline-none focus:border-[hsl(var(--foreground))]"
                />
              </div>
              <div>
                <label htmlFor="s-email" className="mb-1.5 block text-sm font-medium text-[hsl(var(--foreground))]">
                  Email
                </label>
                <input
                  id="s-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@gmail.com"
                  className="h-10 w-full rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--card))] px-3 text-sm outline-none focus:border-[hsl(var(--foreground))]"
                />
              </div>
            </div>
            <div className="mt-4">
              <Button
                size="sm"
                onClick={() => {
                  authStore.updateProfile({ name, email });
                  toast.success("Profile saved");
                }}
              >
                Save changes
              </Button>
            </div>
          </Section>

          {/* Privacy */}
          <Section
            title="Privacy"
            description="Control what others can see."
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[hsl(var(--foreground))]">Public profile</p>
                  <p className="text-xs text-[hsl(var(--muted))]">Allow others to see your name and organisation.</p>
                </div>
                <Switch checked={publicProfile} onCheckedChange={setPublicProfile} />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[hsl(var(--foreground))]">Shareable reports</p>
                  <p className="text-xs text-[hsl(var(--muted))]">Allow reports to be shared via a public link.</p>
                </div>
                <Switch checked={shareReports} onCheckedChange={setShareReports} />
              </div>
            </div>
          </Section>

          {/* Verification history */}
          <Section
            title="Verification history"
            description="Remove reports you created in this browser. Demo samples stay available."
          >
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                mockStore.clearCreated();
                clearPendingInput();
                toast.success("Verification history cleared");
              }}
            >
              Clear verification history
            </Button>
          </Section>

          {/* Data controls */}
          <Section
            title="Data controls"
            description="Export or permanently delete local Visstya data on this device."
          >
            <div className="flex flex-wrap gap-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const blob = new Blob([mockStore.exportJson()], {
                    type: "application/json",
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `visstya-reports-${new Date().toISOString().slice(0, 10)}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success("Data export downloaded");
                }}
              >
                Export my data
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const confirmed = window.confirm(
                    "Delete all local Visstya data on this device? This removes your reports and hides demo samples."
                  );
                  if (!confirmed) return;
                  mockStore.clearAll();
                  clearPendingInput();
                  setName("");
                  setEmail("");
                  setPublicProfile(true);
                  setShareReports(true);
                  setRetention("none");
                  toast.success("All local data deleted");
                }}
              >
                Delete my data
              </Button>
            </div>
          </Section>

          {/* Media retention */}
          <Section
            title="Media retention"
            description="How long uploaded media is kept locally in this browser."
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <RetentionOption
                label="Don't store"
                detail="Media is analysed in-session only and deleted afterwards. Recommended."
                selected={retention === "none"}
                onClick={() => setRetention("none")}
              />
              <RetentionOption
                label="30 days"
                detail="Keep media for a month, then delete it automatically."
                selected={retention === "30"}
                onClick={() => setRetention("30")}
              />
              <RetentionOption
                label="Until deleted"
                detail="Keep media until you remove it from your account."
                selected={retention === "keep"}
                onClick={() => setRetention("keep")}
              />
            </div>
            <p className="mt-4 text-xs leading-relaxed text-[hsl(var(--muted))]">
              By default, Visstya does not store media permanently. Uploaded
              content is held only for the duration of analysis unless you opt in
              to a retention period above.
            </p>
          </Section>

          {/* Account */}
          <Section
            title="Account"
            description={
              isGuest
                ? "No account is required — everything works in guest mode."
                : "Manage your session."
            }
          >
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (isGuest) {
                  window.location.href = "/login";
                } else {
                  void logout();
                  window.location.href = "/";
                }
              }}
            >
              {isGuest ? "Sign in" : "Sign out"}
            </Button>
          </Section>
        </div>
          </div>
      </div>
    </AppShell>
  );
}
