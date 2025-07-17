import Providers from './providers';
import './globals.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || 'Freelance Invoice AI',
  description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'AI-powered freelance invoice generation with Smart Wallet technology on Base',
  other: {
    'fc:frame': JSON.stringify({
      version: 'next',
      imageUrl: process.env.NEXT_PUBLIC_APP_HERO_IMAGE || 'https://your-domain.com/hero.png',
      button: {
        title: `Launch ${process.env.NEXT_PUBLIC_APP_NAME || 'Freelance Invoice AI'}`,
        action: {
          type: 'launch_frame',
          name: process.env.NEXT_PUBLIC_APP_NAME || 'Freelance Invoice AI',
          url: process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com',
          splashImageUrl: process.env.NEXT_PUBLIC_SPLASH_IMAGE || 'https://your-domain.com/splash.png',
          splashBackgroundColor: process.env.NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR || '#0052',
        },
      },
    }),
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script src="https://sdk.cdp.coinbase.com/onramp/v1.js" async />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
} 