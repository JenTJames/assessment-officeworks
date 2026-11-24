import { Link, Outlet } from "react-router";
import { brand } from "@/config/brand";

export function RootLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Link to="/" className="text-lg font-semibold">
            {brand.name}
          </Link>
        </div>
      </header>
      <main className="container mx-auto flex-1 px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
