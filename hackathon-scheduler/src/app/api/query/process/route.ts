import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // 1. Get the user's session from the cookie
    const sessionCookie = request.cookies.get('session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie);
    // This is the sensitive token you need to send
    const userToken = session.tokens.access_token || session.tokens.id_token; 

    // 2. Get the message from the frontend (page.tsx)
    const body = await request.json();
    const { query, timezone } = body;

    // 3. Prepare the exact JSON payload your NLP server expects
    const nlpPayload = {
      messages: [
        {
          role: "user",
          content: query
        }
      ],
      user_token: userToken,
      timezone: timezone || "UTC"
    };

    console.log('Sending payload to NLP server...');

    // --- REPLACE THE URL BELOW ---
    const nlpServerUrl = 'https://8j7d02sv-8000.inc1.devtunnels.ms/chat'; 
    // -----------------------------

    // 4. Send the POST request
    const nlpResponse = await fetch(nlpServerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(nlpPayload)
    });

    if (!nlpResponse.ok) {
      console.error('NLP Server Error:', nlpResponse.status, nlpResponse.statusText);
      return NextResponse.json({ 
        success: false, 
        message: 'The AI server had trouble processing your request.' 
      });
    }

    // 5. Return the NLP server's answer back to your frontend
    const nlpResult = await nlpResponse.json();
    return NextResponse.json(nlpResult);

  } catch (error) {
    console.error('Processing error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}
