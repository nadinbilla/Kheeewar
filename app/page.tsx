"use client";

import { useMemo, useRef, useState, KeyboardEvent } from "react";
import { ArrowLeft, ArrowUp, BookOpen, Bot, Check, ChevronLeft, GraduationCap, MessageCircle, Mic, Plus, Sparkles, Volume2, X } from "lucide-react";
import { examples } from "@/lib/examples";

type Message = { role: "user" | "assistant"; content: string };

const starters = ["عَرِّفْنِي بِنَفْسِكَ", "مَاذَا فَعَلْتَ الْيَوْمَ؟", "أُرِيدُ أَنْ أَتَعَلَّمَ كَلِمَاتٍ جَدِيدَةً"];

export default function Home() {
  const [activeTab, setActiveTab] = useState<"chat" | "examples">("chat");
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "مَرْحَبًا! أَنَا صَدِيقُكَ فِي تَعَلُّمِ اللُّغَةِ الْعَرَبِيَّةِ. 😊
كَيْفَ كَانَ يَوْمُكَ؟ هَيَّا نَتَحَادَثْ بِالْعَرَبِيَّةِ!" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedExample, setSelectedExample] = useState<string | null>(null);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const currentExample = useMemo(() => examples.find((item) => item.id === selectedExample), [selectedExample]);

  async function sendMessage(value = input) {
    const text = value.trim();
    if (!text || loading) return;
    const nextMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Terjadi kesalahan.");
      setMessages([...nextMessages, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tidak dapat menghubungi AI.");
    } finally {
      setLoading(false);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  }

  function speak(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ar-SA";
    utterance.rate = 0.82;
    window.speechSynthesis.speak(utterance);
  }

  function startExample(id: string) {
    const item = examples.find((example) => example.id === id);
    if (!item) return;
    setSelectedExample(id);
    setActiveTab("examples");
  }

  return (
    <main className="site-shell">
      <header className="topbar">
        <a className="brand" href="#" onClick={() => { setActiveTab("chat"); setSelectedExample(null); }}>
          <span className="brand-mark"><MessageCircle size={21} /></span>
          <span><strong>حِوَارِي</strong><small>HIWARI · Arabic with AI</small></span>
        </a>
        <nav className="main-nav">
          <button className={activeTab === "chat" ? "nav-link active" : "nav-link"} onClick={() => { setActiveTab("chat"); setSelectedExample(null); }}><MessageCircle size={16} /> المحادثة <span>Chat AI</span></button>
          <button className={activeTab === "examples" ? "nav-link active" : "nav-link"} onClick={() => { setActiveTab("examples"); setSelectedExample(null); }}><BookOpen size={16} /> أمثلة الحوار <span>Contoh</span></button>
        </nav>
        <div className="header-pill"><span className="online-dot" /> AI siap belajar</div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><Sparkles size={14} /> بَدْءُ رِحْلَتِكَ فِي الْعَرَبِيَّةِ</div>
          <h1>Berani bicara,<br /><em>mulai dari الآن.</em></h1>
          <p>Belajar bahasa Arab jadi lebih hidup. Mulai percakapan, praktikkan kosakata, dan temukan percaya diri bersama teman AI-mu.</p>
          <div className="hero-actions">
            <button className="primary-btn" onClick={() => { setActiveTab("chat"); setSelectedExample(null); }}>Mulai ngobrol <ArrowLeft size={17} /></button>
            <span className="hero-note"><span className="mini-avatars">ع م أ</span> Latihan kapan saja, tanpa takut salah</span>
          </div>
        </div>
        <div className="hero-art" aria-label="Ilustrasi belajar bahasa Arab">
          <div className="art-spark spark-one">✳</div><div className="art-spark spark-two">✦</div>
          <div className="speech-bubble bubble-top">مَرْحَبًا! <span>👋</span></div>
          <div className="chat-illustration">
            <div className="orbit orbit-one" /><div className="orbit orbit-two" />
            <div className="book-shape"><BookOpen size={68} strokeWidth={1.4} /></div>
            <div className="bot-face"><Bot size={48} strokeWidth={1.5} /><span className="bot-heart">♥</span></div>
            <div className="floating-star">✦</div>
          </div>
          <div className="speech-bubble bubble-bottom">أَنَا مُسْتَعِدٌّ! <span>✨</span></div>
          <div className="art-caption">LEARN · PRACTICE · GROW</div>
        </div>
      </section>

      <section className="workspace" id="workspace">
        <div className="section-heading">
          <div><div className="section-kicker">RUANG LATIHAN</div><h2>{activeTab === "chat" ? "Ayo mulai percakapan!" : currentExample ? currentExample.title : "Pilih contoh percakapan"}</h2></div>
          <div className="level-tag"><GraduationCap size={16} /> Pemula sampai mahir</div>
        </div>

        {activeTab === "chat" ? (
          <div className="chat-layout">
            <aside className="practice-sidebar">
              <div className="side-title"><span className="side-icon"><BookOpen size={17} /></span><div><b>Topik latihan</b><small>Pilih situasi percakapan</small></div></div>
              {examples.map((example) => (
                <button key={example.id} className="topic-row" onClick={() => startExample(example.id)}>
                  <span className="topic-emoji">{example.icon}</span><span><b>{example.title}</b><small>{example.subtitle}</small></span><ChevronLeft size={16} />
                </button>
              ))}
              <div className="tip-card"><Sparkles size={17} /><b>Tips belajar</b><p>Jangan takut salah! AI akan membantu memperbaiki kalimat Arabmu dengan cara yang mudah dipahami.</p></div>
            </aside>

            <div className="chat-card">
              <div className="chat-head"><div className="ai-avatar"><Bot size={22} /></div><div><b>Teman Bahasa Arab</b><small><span className="online-dot" /> Online · siap menemanimu</small></div><button className="icon-button reset-btn" title="Mulai ulang" onClick={() => { setMessages([{ role: "assistant", content: "مَرْحَبًا! أَنَا صَدِيقُكَ فِي تَعَلُّمِ اللُّغَةِ الْعَرَبِيَّةِ. 😊
كَيْفَ كَانَ يَوْمُكَ؟ هَيَّا نَتَحَادَثْ بِالْعَرَبِيَّةِ!" }]); setError(""); }}><Plus size={18} /></button></div>
              <div className="messages">
                <div className="date-divider"><span>مَرْحَبًا · SELAMAT DATANG</span></div>
                {messages.map((message, index) => (
                  <div key={index} className={message.role === "user" ? "message-row user-row" : "message-row"}>
                    {message.role === "assistant" && <div className="tiny-avatar"><Bot size={15} /></div>}
                    <div className={message.role === "user" ? "bubble user-message" : "bubble ai-message"}>
                      <p dir="auto">{message.content}</p>
                      {message.role === "assistant" && <button className="speak-btn" onClick={() => speak(message.content)}><Volume2 size={14} /> Dengarkan</button>}
                    </div>
                  </div>
                ))}
                {loading && <div className="message-row"><div className="tiny-avatar"><Bot size={15} /></div><div className="bubble ai-message typing"><i /><i /><i /></div></div>}
                {error && <div className="error-note">{error}</div>}
                <div ref={endRef} />
              </div>
              {messages.length === 1 && <div className="quick-prompts">{starters.map((starter) => <button key={starter} onClick={() => void sendMessage(starter)}>{starter}</button>)}</div>}
              <div className="composer">
                <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={onKeyDown} placeholder="اكتب رسالتك هنا... Tulis pesan dalam bahasa Arab atau Indonesia" rows={2} />
                <button className="send-btn" onClick={() => void sendMessage()} disabled={!input.trim() || loading} aria-label="Kirim pesan"><ArrowUp size={21} /></button>
              </div>
              <div className="composer-foot"><span><Check size={13} /> AI akan membantu koreksi bahasa Arabmu</span><span>Enter untuk mengirim · Shift + Enter untuk baris baru</span></div>
            </div>
          </div>
        ) : (
          <div className="examples-area">
            {currentExample ? (
              <div className="example-detail">
                <button className="back-link" onClick={() => setSelectedExample(null)}><ArrowLeft size={16} /> Kembali ke semua contoh</button>
                <div className="example-detail-head"><span className="topic-emoji large">{currentExample.icon}</span><div><h3>{currentExample.title}</h3><p>{currentExample.subtitle} · Level {currentExample.level}</p></div><button className="primary-btn" onClick={() => { setMessages([{ role: "assistant", content: `هَيَّا نَتَدَرَّبُ عَلَى مَوْضُوعِ: ${currentExample.title}. تَفَضَّلْ، ابْدَأِ الْحِوَارَ!` }]); setActiveTab("chat"); setSelectedExample(null); }}>Praktikkan dengan AI <ArrowLeft size={16} /></button></div>
                <div className="dialogue-list">{currentExample.turns.map((turn, index) => <div className="dialogue-turn" key={index}><div className="speaker-label">{turn.speaker}</div><div className="dialogue-arabic" dir="rtl">{turn.arabic}</div><div className="dialogue-meaning">{turn.meaning}</div><button className="listen-line" onClick={() => speak(turn.arabic)}><Volume2 size={15} /> Dengarkan</button></div>)}</div>
              </div>
            ) : <div className="example-grid">{examples.map((example) => <button className="example-card" key={example.id} onClick={() => setSelectedExample(example.id)}><div className="example-card-top"><span className="topic-emoji large">{example.icon}</span><span className="level-chip">{example.level}</span></div><h3>{example.title}</h3><p>{example.subtitle}</p><div className="card-bottom"><span>{example.turns.length} baris percakapan</span><span className="round-arrow"><ArrowLeft size={16} /></span></div></button>)}</div>}
          </div>
        )}
      </section>
      <footer><a className="footer-brand" href="#">حِوَارِي</a><span>Belajar bahasa Arab, satu percakapan setiap hari.</span><span>Made with ♡ for curious learners</span></footer>
    </main>
  );
}
