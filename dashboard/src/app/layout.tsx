import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Skyflow AI Security Demo',
  description: 'Demonstrating how Skyflow protects AI agents from data exfiltration attacks',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
