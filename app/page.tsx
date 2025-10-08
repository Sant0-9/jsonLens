import { Navigation } from "@/components/navigation";
import { JsonViewer } from "@/components/json-viewer";
import { OnboardingTooltip } from "@/components/onboarding-tooltip";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";
import { WorkspaceTabs } from "@/components/workspace-tabs";
import { CrashRecovery } from "@/components/crash-recovery";
import { ConditionalStatusBar } from "@/components/conditional-status-bar";

export default function Home() {
  return (
    <>
      <CrashRecovery />
      <KeyboardShortcuts />
      <Navigation />
      <WorkspaceTabs />
      <main className="container mx-auto px-4 py-8">
        <JsonViewer />
      </main>
      <ConditionalStatusBar />
      <OnboardingTooltip />
    </>
  );
}
