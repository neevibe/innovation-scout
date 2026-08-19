import { Repo } from "@/lib/db/store";
import { Topbar } from "@/components/Topbar";
import { AdminClient } from "./AdminClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [config, cities] = await Promise.all([Repo.config(), Repo.cities()]);
  return (
    <>
      <Topbar title="Admin & Scoring" subtitle="Configure scoring weights, thresholds, cities and data sources" mode={config.mode} lastRefresh={config.lastRefreshAt} />
      <AdminClient config={config} cities={cities} />
    </>
  );
}
