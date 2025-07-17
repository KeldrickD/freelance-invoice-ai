import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Store notification data (in production, use Redis or database)
    console.log('Notification received:', body);
    
    // You can integrate with your existing backend here
    // For example, send to your AgentKit backend for processing
    
    return NextResponse.json({ 
      success: true,
      message: 'Notification processed successfully'
    });
  } catch (error) {
    console.error('Notification error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process notification' },
      { status: 500 }
    );
  }
} 