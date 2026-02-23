export default function TVLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen"
      style={{
        backgroundImage: `
          radial-gradient(ellipse 100% 60% at 50% -5%, rgba(56,120,255,0.45) 0%, transparent 68%),
          radial-gradient(ellipse 60% 50% at -5% 15%, rgba(130,60,220,0.25) 0%, transparent 65%),
          radial-gradient(ellipse 55% 45% at 105% 10%, rgba(20,160,220,0.22) 0%, transparent 60%),
          linear-gradient(180deg, #0b1120 0%, #080c18 30%, #060810 65%, #05070d 100%)
        `,
        backgroundAttachment: "fixed",
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
