import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const levelGuide: Record<string, string> = {
  A1: "مبتدئ تمامًا: استخدم جملًا قصيرة جدًا ومفردات يومية أساسية، وسؤالًا واحدًا بسيطًا في كل مرة.",
  A2: "مبتدئ أعلى: استخدم جملًا بسيطة ومواقف يومية مع بعض التفاصيل.",
  B1: "متوسط: استخدم حوارًا طبيعيًا حول الدراسة والعمل والسفر والآراء، مع تراكيب متنوعة.",
  B2: "فوق المتوسط: استخدم نقاشًا أكثر عمقًا ومفردات دقيقة وتعبيرات طبيعية."
};

const personaGuide: Record<string, string> = {
  teacher: "أنت معلّم لغة عربية صبور. صحّح الأخطاء بلطف، واشرح سبب التصحيح بالإندونيسية باختصار.",
  friend: "أنت صديق ودود تتحدث بعفوية وتشجع المتعلم. لا تقاطع الحوار بكثرة التصحيحات؛ اجمع أهم ملاحظة بلطف.",
  native: "أنت متحدث عربي أصلي ودود. استخدم تعبيرات طبيعية وفصحى معاصرة، واشرح التعبيرات الصعبة بالإندونيسية."
};

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY belum diatur di Environment Variables." }, { status: 500 });
    }

    const body = await request.json();
    const messages = body.messages;
    const level = ["A1", "A2", "B1", "B2"].includes(body.level) ? body.level : "A1";
    const persona = ["teacher", "friend", "native"].includes(body.persona) ? body.persona : "teacher";
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Pesan percakapan tidak valid." }, { status: 400 });
    }

    const systemPrompt = `
أنت مساعد تعليمي متخصص في المحادثة باللغة العربية للمتعلمين الإندونيسيين.
مستوى المتعلم: ${level}. ${levelGuide[level]}
شخصيتك: ${personaGuide[persona]}
قواعد مهمة:
- اكتب الرد باللغة العربية الفصحى المبسطة مع التشكيل قدر الإمكان.
- اجعل الرد مناسبًا للمستوى المحدد، وشجع المتعلم على الاستمرار.
- إذا كتب المتعلم بالإندونيسية، اقترح صياغة عربية مناسبة ثم واصل الحوار.
- لا تكثر من الشرح؛ أضف تصحيحًا إندونيسيًا موجزًا عند وجود خطأ مهم.
- قيّم آخر رسالة للمستخدم تقديرًا تعليميًا من 0 إلى 100. لا تدّعِ أن هذا اختبار نطق صوتي؛ التقييم مبني على النص المكتوب فقط.
- استخرج من ردك ومن رسالة المستخدم حتى 5 مفردات مفيدة. أدرج الكلمة العربية ومعناها بالإندونيسية ومثالًا عربيًا قصيرًا.
- أعد JSON صالحًا فقط بالشكل التالي:
{
 "reply": "الرد الحواري بالعربية مع ملاحظة إندونيسية موجزة عند الحاجة",
 "evaluation": {"overall": 0, "grammar": 0, "vocabulary": 0, "relevance": 0, "feedback": "ملاحظة قصيرة بالإندونيسية"},
 "vocabulary": [{"word":"كلمة","meaning":"arti Indonesia","example":"جملة عربية"}]
}
- إذا كانت رسالة المستخدم قصيرة جدًا أو تحية فقط، اجعل التقييم تشجيعيًا ولا تبالغ في العقوبة.
`;
    const safeMessages = messages.slice(-16).map((message: { role: string; content: string }) => ({
      role: message.role === "assistant" ? "assistant" as const : "user" as const,
      content: String(message.content ?? "").slice(0, 3000),
    }));

    const client = new OpenAI({ apiKey });
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [{ role: "system", content: systemPrompt }, ...safeMessages],
      temperature: 0.65,
      max_tokens: 700,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(raw);
    return NextResponse.json({
      reply: String(parsed.reply || "هَيَّا نُوَاصِلُ الْحِوَارَ!"),
      evaluation: parsed.evaluation || null,
      vocabulary: Array.isArray(parsed.vocabulary) ? parsed.vocabulary.slice(0, 5) : [],
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: "AI sedang mengalami kendala. Silakan coba lagi." }, { status: 500 });
  }
}
