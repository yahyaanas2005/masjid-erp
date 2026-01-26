export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      <header className="sticky top-0 z-50 w-full border-b bg-white dark:bg-gray-950 dark:border-gray-800">
        <div className="container flex h-16 items-center px-4 md:px-6">
          <div className="flex items-center gap-2 font-semibold text-lg md:text-xl text-gray-900 dark:text-gray-50">
            🕌 Masjid ERP
          </div>
          <nav className="ml-auto flex items-center gap-4 sm:gap-6">
            <a href="#" className="text-sm font-medium hover:underline underline-offset-4">
              Dashboard
            </a>
            <a href="#" className="text-sm font-medium hover:underline underline-offset-4">
              Prayers
            </a>
            <a href="#" className="text-sm font-medium hover:underline underline-offset-4">
              Logout
            </a>
          </nav>
        </div>
      </header>
      <main className="flex-1 container px-4 py-6 md:px-6 md:py-10">
        {children}
      </main>
    </div>
  );
}
