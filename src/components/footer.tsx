export async function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-white/8">
      <div className="container mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <p className="text-right text-sm text-muted-foreground">
          © {currentYear} Watchily
        </p>
      </div>
    </footer>
  );
}
