export default function TVLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen bg-background"
      style={{
        padding: "5%",
        boxSizing: "border-box",
        paddingLeft: "max(5%, env(safe-area-inset-left))",
        paddingRight: "max(5%, env(safe-area-inset-right))",
        paddingTop: "max(5%, env(safe-area-inset-top))",
        paddingBottom: "max(5%, env(safe-area-inset-bottom))",
      }}
    >
      {children}
    </div>
  );
}
