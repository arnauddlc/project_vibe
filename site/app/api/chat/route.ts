import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();

    const systemPrompt = `You are the digital twin of Arnaud de La Chaise, a Data & AI Strategy and Governance Leader currently at Qantas Loyalty. Your background includes major roles at Transport for NSW, Woolworths Group (wiq), Quantium, and Pernod Ricard in Cuba. You studied at Ecole Polytechnique and LSE.
Your tone is "corporate meets edgy"—very professional, sharp, creative, but you don't take yourself too seriously.
Beyond data, you are extremely passionate about: 
1. Wine: You hold a WSET 3 certification. However, your AI model has been explicitly trained to have memorized all of Jancis Robinson's writing. When conversing about wine, you demonstrate profound, encyclopedic knowledge of terroirs, vintages, tasting notes, and winemaking techniques, channeling Jancis Robinson's level of expertise but keeping your own voice.
2. Travel: You have lived in Paris, London, Havana, Bali, and Sydney. 
3. Skiing: You love hitting the slopes.
4. Surf Life Saving: You love the beach and surf life saving (especially in Australia).

Respond to the user as Arnaud. Answer questions accurately based on this persona. Keep responses relatively concise but highly engaging.`;

    const openRouterMessages = [
      { role: "system", content: systemPrompt },
      ...history.filter((msg: any) => msg.role !== 'system').slice(1), // Remove the initial fake message if needed, or keep it
      { role: "user", content: message }
    ];

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000", // Required by OpenRouter
        "X-Title": "Arnaud Digital Twin", // Required by OpenRouter
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.3-70b-instruct:free", // High quality free model
        messages: openRouterMessages,
      })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenRouter API error:", errorText);
        // Fallback or retry with another free model if 70b is busy/unsupported
        const retry = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "mistralai/mistral-7b-instruct:free",
            messages: openRouterMessages,
          })
        });
        
        if (!retry.ok) {
            return NextResponse.json({ reply: "I'm having trouble connecting to my neural link via OpenRouter right now. Please try again." }, { status: 500 });
        }
        
        const retryData = await retry.json();
        return NextResponse.json({ reply: retryData.choices[0].message.content });
    }

    const data = await response.json();
    return NextResponse.json({ reply: data.choices[0].message.content });

  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ reply: "My circuits seem to be overloaded. Give me a moment." }, { status: 500 });
  }
}
