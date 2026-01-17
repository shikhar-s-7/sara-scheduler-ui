import { NextRequest, NextResponse } from 'next/server';

// Optional: Configure segment config if needed for timeouts in specific environments
export const maxDuration = 600; 

export async function POST(request: NextRequest) {
  try {
    // 1. Get the user's session from the cookie
    const sessionCookie = request.cookies.get('session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie);
    const userToken = session.tokens.access_token || session.tokens.id_token; 

    // 2. Get the message from the frontend
    const body = await request.json();
    const { query, timezone } = body;

    // 3. Prepare payload
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

    const nlpServerUrl = 'https://8j7d02sv-8000.inc1.devtunnels.ms/chat'; 

    // --- TIMEOUT LOGIC ---
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 600000); // 10 minutes

    try {
      // 4. Send the POST request
      const nlpResponse = await fetch(nlpServerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(nlpPayload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!nlpResponse.ok) {
        console.error('NLP Server Error:', nlpResponse.status, nlpResponse.statusText);
        return NextResponse.json({ 
          success: false, 
          message: 'The AI server had trouble processing your request.' 
        });
      }

      // 5. Return result
      const nlpResult = await nlpResponse.json();
      return NextResponse.json(nlpResult);

    } catch (fetchError: unknown) {
       clearTimeout(timeoutId);
       
       // Type-safe check for AbortError
       if (fetchError instanceof Error && fetchError.name === 'AbortError') {
         console.error('NLP Server Timed Out (10 mins exceeded)');
         return NextResponse.json({ 
             success: false, 
             message: 'The AI server took too long to respond (10+ mins).' 
         }, { status: 504 });
       }
       throw fetchError;
    }

  } catch (error) {
    console.error('Processing error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}
