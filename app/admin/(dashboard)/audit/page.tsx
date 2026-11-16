import { AuditLogsViewer } from "@/components/admin/AuditLogsViewer";

export default function AuditPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-bold tracking-tight text-text">
          Enterprise Audit Logs & Traceability
        </h1>
        <p className="text-sm text-muted">
          Security events, permission changes, workflow activations, and autonomous agent history.
        </p>
      </div>

      <AuditLogsViewer />
    </div>
  );
}
