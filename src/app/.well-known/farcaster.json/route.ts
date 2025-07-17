import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    frame: [object Object]
      version: '1',
      name: process.env.NEXT_PUBLIC_APP_NAME || Freelance Invoice AI,
      subtitle: 'Automate freelance payments on Base',
      description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'AI-powered freelance invoice generation with Smart Wallet technology on Base',
      screenshotUrls:// Add if you have
      iconUrl: process.env.NEXT_PUBLIC_APP_ICON || 'https://your-domain.com/icon.png',
      splashImageUrl: process.env.NEXT_PUBLIC_SPLASH_IMAGE || 'https://your-domain.com/splash.png',
      splashBackgroundColor: process.env.NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR || '#052ff',
      homeUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com',
      webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com'}/api/webhook`, // For notifications
      primaryCategory: finance', // Or tools'
      tags: [base', freelance,ai, agents',smart-wallet'],
      heroImageUrl: process.env.NEXT_PUBLIC_APP_HERO_IMAGE || 'https://your-domain.com/hero.png',
      tagline: 'AI invoices in your wallet',
      ogTitle: process.env.NEXT_PUBLIC_APP_NAME || Freelance Invoice AI',
      ogDescription: process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'AI-powered freelance invoice generation with Smart Wallet technology on Base',
      ogImageUrl: process.env.NEXT_PUBLIC_APP_HERO_IMAGE || 'https://your-domain.com/hero.png,
    },
  });
} 