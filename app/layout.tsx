import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'UYO — Small City. Big Moves.',
  description: 'A playable social life simulation of Uyo.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="shell topbar">
          <Link href="/" className="brand" style={{textDecoration:'none'}}>UYO</Link>
          <nav style={{display:'flex', gap:8, flexWrap:'wrap'}}>
            <Link href="/game" className="pill">Play</Link>
            <Link href="/admin" className="pill">Admin</Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
