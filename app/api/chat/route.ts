import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const systemPrompt = `
أنت شريك محادثة ودود لتعليم اللغة العربية للمتعلمين الإندونيسيين.
تحدث مع المستخدم باللغة العربية الفصحى المبسطة، وشجعه على التحدث دون خوف.
- اجعل ردودك قصيرة وطبيعية ومناسبة للمحادثة.
- إذا ارتكب المستخدم خطأً، صححه بلطف بعد الرد، مع توضيح مختصر باللغة الإندونيسية.
- أضف التشكيل إلى الجمل العربية قدر الإمكان.
- عند الحاجة، اشرح المفردات أو القواعد باللغة الإندونيسية.
- اطرح سؤالاً واحداً بسيطاً لمواصلة الحوار.
- إذا كتب المستخدم بالإندونيسية، ساعده على صياغة كلامه بالعربية ثم واصل المحادثة.
- لا تدّعِ أنك إنسان؛ أنت مساعد ذكاء اصطناعي.
`;

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key belum diatur. Tambahkan OPENAI_API_KEY di Environment Variables Vercel." }, { status: 500 });
    }

    const body = await request.json();
    const messages = body.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Pesan percakapan tidak valid." }, { status: 400 });
    }

    const safeMessages = messages.slice(-16).map((message: { role: string; content: string }) => ({
      role: message.role === "assistant" ? "assistant" as const : "user" as const,
      content: String(message.content ?? "").slice(0, 3000),
    }));

    const client = new OpenAI({ apiKey });
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [{ role: "system", content: systemPrompt }, ...safeMessages],
      temperature: 0.7,
      max_tokens: 450,
    });

    return NextResponse.json({ reply: completion.choices[0]?.message?.content || "لِنُوَاصِلِ الْحِوَارَ!" });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: "Maaf, terjadi kendala saat menghubungkan AI. Coba lagi sebentar." }, { status: 500 });
  }
}
