import "./globals.css";

export const metadata = { title: "Sunga Hospital — eKonsulta", description: "PhilHealth eKonsulta (PCB) UI mock" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
