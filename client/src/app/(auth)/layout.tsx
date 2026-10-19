import { BrandHeader } from "@/components/brand-header";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1 flex-col">
      <BrandHeader />
      <main className="flex flex-1 items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
