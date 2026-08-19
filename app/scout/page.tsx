import { Repo } from "@/lib/db/store";
import { Topbar } from "@/components/Topbar";
import { ScoutClient } from "./ScoutClient";

export const dynamic = "force-dynamic";

export default async function ScoutPage() {
  const config = await Repo.config();
  return (
    <>
      <Topbar title="AI Scout" subtitle="Ask a commercial-intelligence question — grounded in real collected signals" mode={config.mode} lastRefresh={config.lastRefreshAt} />
      <div style={{ padding: "28px 34px 48px" }}>
        <ScoutClient />
      </div>
    </>
  );
}
