import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AutoMeat Control Plane — StudEx Meat (Demo)',
  description: 'Phase 1 control plane with example data only',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
