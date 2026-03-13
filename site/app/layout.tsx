import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Arnaud de La Chaise | Data & AI Strategy',
  description: 'Data & AI Strategy and Governance leader @ Qantas Loyalty. Former Transport for NSW, Woolworths Group, Quantium, and Pernod Ricard.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="bg-glow"></div>
        <div className="bg-pattern"></div>
        {children}
      </body>
    </html>
  );
}
