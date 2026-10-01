import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <div className="space-y-1">
      <h1 className="font-heading text-2xl font-semibold">Your resumes</h1>
      <p className="text-sm text-muted-foreground">Create a resume or pick one to keep editing.</p>
    </div>
  );
}
