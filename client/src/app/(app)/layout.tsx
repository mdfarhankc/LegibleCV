import { SiteHeader } from "@/components/site-header";
import { requireUser } from "@/lib/auth/dal";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader user={user} />
      {/* Each page sets its own width and padding: the editor fills the screen, the rest don't. */}
      <main className="flex w-full flex-1 flex-col">{children}</main>
    </div>
  );
}
