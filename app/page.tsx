 "use client";

import { useEffect, useMemo, useRef, useState, KeyboardEvent } from "react";
import {
  ArrowLeft, ArrowUp, BookOpen, Bot, Check, ChevronDown, Clock3, GraduationCap,
  History, Languages, Mic, MicOff, MessageCircle, Plus, Sparkles, Volume2, X,
  ChartNoAxesColumnIncreasing, UserRound, Headphones, Trash2, Star, Menu
} from "lucide-react";
import { examples } from "@/lib/examples";

type Role = "user" | "assistant";
type Message = { role: Role; content: string };
type Vocab = { word: string; meaning: string; example: string };
type Evaluation = { overall: number; grammar: number; vocabulary: number; relevance: number; feedback: string };
type SavedSession = { id: string; title: string; date: string; level: string; persona: string; messages: Message[]; evaluation?: Evaluation; vocabulary: Vocab[] };

const levels = [
  { id: "A1", name: "Pemula", desc: "Kata dan kalimat sederhana" },
  { id: "A2", name: "Dasar", desc: "Situasi sehari-hari" },
  { id: "B1", name: "Menengah", desc: "Cerita dan menyampaikan pendapat" },
  { id: "B2", name: "Lanjutan", desc: "Diskusi dan ekspresi kompleks" },
];
const personas = [
  { id: "teacher", name: "Guru", desc: "Sabar dan membantu koreksi", icon: "👩‍🏫" },
  { id: "friend", name: "Teman", desc: "Santai seperti teman ngobrol", icon: "😊" },
  { id: "native", name: "Penutur asli", desc: "Bahasa lebih alami", icon: "🗣️" },
];
const greeting = "مَرْحَبًا! أَنَا صَدِيقُكَ فِي تَعَلُّمِ اللُّغَةِ الْعَرَبِيَّةِ. هَيَّا نَتَحَادَثْ!";

export default function Home() {
  const [tab, setTab] = useState<"chat" | "examples" | "history" | "vocabulary" | "progress">("chat");
  const [level, setLevel] = useState("A1");
  const [persona, setPersona] = useState("teacher");
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", content: greeting }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [vocabulary, setVocabulary] = useState<Vocab[]>([]);
  const [history, setHistory] = useState<SavedSession[]>([]);
  const [selectedExample, setSelectedExample] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const currentExample = useMemo(() => examples.find((item) => item.id === selectedExample), [selectedExample]);
  const currentLevel = levels.find((item) => item.id === level)!;
  const currentPersona = personas.find((item) => item.id === persona)!;

  useEffect(() => {
    try {
      const saved = localStorage.getItem("hiwari-sessions-v2");
      if (saved) setHistory(JSON.parse(saved));
    } catch { /* ignore invalid local data */ }
  }, []);

  useEffect(() => {
    localStorage.setItem("hiwari-sessions-v2", JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function saveSession(nextMessages = messages, nextEval = evaluation, nextVocab = vocabulary) {
    if (nextMessages.filter((m) => m.role === "user").length === 0) return;
    const id = activeSession || (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now()));
    const firstUser = nextMessages.find((m) => m.role === "user")?.content || "Latihan percakapan";
    const session: SavedSession = {
      id, title: firstUser.slice(0, 42), date: new Date().toISOString(), level, persona,
      messages: nextMessages, evaluation: nextEval || undefined, vocabulary: nextVocab
    };
    setHistory((old) => [session, ...old.filter((item) => item.id !== id)].slice(0, 100));
    setActiveSession(id);
  }

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
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, level, persona }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Terjadi kesalahan.");
      const finalMessages: Message[] = [...nextMessages, { role: "assistant", content: data.reply }];
      const nextEval = data.evaluation as Evaluation | null;
      const incoming = (data.vocabulary || []) as Vocab[];
      const nextVocab = [...incoming, ...vocabulary].filter((item, index, arr) => arr.findIndex((x) => x.word === item.word) === index).slice(0, 100);
      setMessages(finalMessages);
      setEvaluation(nextEval);
      setVocabulary(nextVocab);
      saveSession(finalMessages, nextEval, nextVocab);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tidak dapat menghubungi AI.");
    } finally {
      setLoading(false);
    }
  }

  function startNewChat() {
    setMessages([{ role: "assistant", content: greeting }]);
    setEvaluation(null); setVocabulary([]); setActiveSession(null); setError(""); setTab("chat");
  }

  function loadSession(session: SavedSession) {
    setMessages(session.messages); setLevel(session.level); setPersona(session.persona);
    setEvaluation(session.evaluation || null); setVocabulary(session.vocabulary || []);
    setActiveSession(session.id); setTab("chat");
  }

  function speak(text: string) {
    if (!("speechSynthesis" in window)) { setError("Browser ini belum mendukung fitur suara."); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ar-SA"; utterance.rate = level === "A1" ? 0.75 : 0.88;
    window.speechSynthesis.speak(utterance);
  }

  function toggleMic() {
    if (listening) { recognitionRef.current?.stop(); setListening(false); return; }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { setError("Browser belum mendukung pengenalan suara. Gunakan Chrome atau Edge terbaru."); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = "ar-SA"; recognition.interimResults = true; recognition.continuous = false;
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results).map((result: any) => result[0].transcript).join("");
      setInput(transcript);
    };
    recognition.onerror = () => { setListening(false); setError("Mikrofon tidak dapat digunakan. Periksa izin mikrofon browser."); };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition; recognition.start(); setListening(true); setError("");
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(); }
  }

  const navItems = [
    { id: "chat", label: "Percakapan AI", icon: MessageCircle },
    { id: "examples", label: "Contoh dialog", icon: BookOpen },
    { id: "history", label: "Riwayat belajar", icon: History },
    { id: "vocabulary", label: "Kosakata saya", icon: Languages },
    { id: "progress", label: "Evaluasi", icon: ChartNoAxesColumnIncreasing },
  ] as const;

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" onClick={(e) => { e.preventDefault(); setTab("chat"); }}>
          <span className="brand-mark"><MessageCircle size={21} /></span>
          <span><strong>حِوَارِي</strong><small>HIWARI · ARABIC LEARNING AI</small></span>
        </a>
        <nav className="top-nav">
          {navItems.slice(0, 3).map((item) => <button key={item.id} className={tab === item.id ? "top-nav-item active" : "top-nav-item"} onClick={() => setTab(item.id)}>{item.label}</button>)}
        </nav>
        <button className="new-chat-btn" onClick={startNewChat}><Plus size={16} /> Percakapan baru</button>
      </header>

      <div className="dashboard">
        <aside className="sidebar">
          <div className="sidebar-label">MENU BELAJAR</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return <button key={item.id} className={tab === item.id ? "side-nav active" : "side-nav"} onClick={() => { setTab(item.id); setSelectedExample(null); }}><Icon size={17} />{item.label}{item.id === "history" && history.length > 0 && <span className="nav-count">{history.length}</span>}</button>;
          })}
          <div className="sidebar-divider" />
          <div className="sidebar-label">PENGATURAN LATIHAN</div>
          <label className="setting-label">Level bahasa Arab</label>
          <div className="level-select-list">
            {levels.map((item) => <button key={item.id} className={level === item.id ? "level-option selected" : "level-option"} onClick={() => setLevel(item.id)}><b>{item.id}</b><span>{item.name}</span>{level === item.id && <Check size={14} />}</button>)}
          </div>
          <label className="setting-label persona-label">Partner AI</label>
          <div className="persona-list">
            {personas.map((item) => <button key={item.id} className={persona === item.id ? "persona-option selected" : "persona-option"} onClick={() => setPersona(item.id)}><span className="persona-emoji">{item.icon}</span><span><b>{item.name}</b><small>{item.desc}</small></span>{persona === item.id && <Check size={14} />}</button>)}
          </div>
          <div className="sidebar-tip"><Sparkles size={16} /><b>Belajar konsisten</b><p>Latihan 10–15 menit setiap hari membantu membangun kebiasaan berbicara.</p></div>
        </aside>

        <section className="main-content">
          {tab === "chat" && <>
            <div className="page-heading"><div><div className="eyebrow"><Sparkles size={14} /> مَرْحَبًا بِكَ فِي حِوَارِي</div><h1>Waktunya latihan berbicara!</h1><p>Ngobrol dalam bahasa Arab, dapatkan koreksi, dan tingkatkan kemampuanmu.</p></div><div className="current-settings"><span>{level}</span><span>{currentPersona.icon} {currentPersona.name}</span></div></div>
            <div className="chat-workspace">
              <div className="chat-panel">
                <div className="chat-panel-head"><div className="ai-avatar"><Bot size={22} /></div><div className="partner-title"><b>{currentPersona.name} Bahasa Arab</b><small><i /> AI siap menemanimu · Level {level}</small></div><button className="head-icon" onClick={startNewChat} title="Percakapan baru"><Plus size={18} /></button></div>
                <div className="messages">
                  <div className="date-chip">بِسْمِ اللَّهِ · MULAI BERLATIH</div>
                  {messages.map((message, index) => <div key={index} className={message.role === "user" ? "message-row user-row" : "message-row"}>{message.role === "assistant" && <div className="tiny-avatar"><Bot size={15} /></div>}<div className={message.role === "user" ? "bubble user-bubble" : "bubble ai-bubble"}><p dir="auto">{message.content}</p>{message.role === "assistant" && <button className="listen-btn" onClick={() => speak(message.content)}><Volume2 size={14} /> Dengarkan</button>}</div></div>)}
                  {loading && <div className="message-row"><div className="tiny-avatar"><Bot size={15} /></div><div className="bubble ai-bubble typing"><i /><i /><i /></div></div>}
                  {error && <div className="error-box">{error}</div>}
                  <div ref={endRef} />
                </div>
                {messages.length === 1 && <div className="suggested-prompts"><span>Coba mulai dengan:</span>{["مَا اسْمُكَ؟", "كَيْفَ حَالُكَ؟", "مَاذَا تُحِبُّ؟"].map((s) => <button key={s} onClick={() => void sendMessage(s)}>{s}</button>)}</div>}
                <div className="composer"><button className={listening ? "mic-btn recording" : "mic-btn"} onClick={toggleMic} title="Gunakan mikrofon">{listening ? <MicOff size={19} /> : <Mic size={19} />}</button><textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKeyDown} rows={2} placeholder="اكتب أو تَحَدَّثْ بالعربية... Tulis atau ucapkan pesanmu" /><button className="send-btn" onClick={() => void sendMessage()} disabled={!input.trim() || loading}><ArrowUp size={20} /></button></div>
                <div className="composer-hint"><span>{listening ? "Mikrofon aktif — silakan berbicara" : "Klik mikrofon untuk berbicara dalam bahasa Arab"}</span><span>Enter untuk mengirim</span></div>
              </div>

              <aside className="insight-column">
                <div className="insight-card score-card"><div className="insight-title"><ChartNoAxesColumnIncreasing size={17} /><b>Penilaian terakhir</b></div>{evaluation ? <><div className="score-number">{evaluation.overall}<small>/100</small></div><div className="score-bar"><span style={{ width: `${evaluation.overall}%` }} /></div><div className="score-breakdown">{[["Tata bahasa", evaluation.grammar], ["Kosakata", evaluation.vocabulary], ["Relevansi", evaluation.relevance]].map(([label, score]) => <div key={label as string}><span>{label}</span><b>{score}</b></div>)}</div><p className="feedback-text">{evaluation.feedback}</p></> : <div className="empty-insight"><Star size={22} /><p>Skor latihan akan muncul setelah kamu mengirim jawaban.</p></div>}</div>
                <div className="insight-card"><div className="insight-title"><Languages size={17} /><b>Kosakata sesi ini</b><span className="small-count">{vocabulary.length}</span></div>{vocabulary.length ? vocabulary.slice(0, 5).map((item) => <div className="mini-word" key={item.word}><b>{item.word}</b><span>{item.meaning}</span></div>) : <div className="empty-insight"><BookOpen size={21} /><p>Kata baru dari percakapanmu akan tersimpan di sini.</p></div>}<button className="text-link" onClick={() => setTab("vocabulary")}>Lihat semua kosakata <ArrowLeft size={13} /></button></div>
                <div className="insight-card mini-tip"><Sparkles size={17} /><div><b>Tips kecil</b><p>Coba jawab dengan kalimat lengkap, bukan hanya satu kata.</p></div></div>
              </aside>
            </div>
          </>}

          {tab === "examples" && <div className="content-page"><div className="eyebrow">PRAKTIK BERDASARKAN SITUASI</div><h1>Contoh percakapan</h1><p className="page-subtitle">Pelajari dialog singkat, dengarkan pengucapannya, lalu praktikkan bersama AI.</p>{currentExample ? <div className="example-detail"><button className="back-link" onClick={() => setSelectedExample(null)}><ArrowLeft size={15} /> Semua contoh</button><h2>{currentExample.title}</h2><p>{currentExample.subtitle}</p><div className="dialogue-list">{currentExample.turns.map((turn, index) => <div className="dialogue-turn" key={index}><b>{turn.speaker}</b><div className="dialogue-arabic">{turn.arabic}</div><div className="dialogue-meaning">{turn.meaning}</div><button onClick={() => speak(turn.arabic)}><Volume2 size={14} /> Dengarkan</button></div>)}</div><button className="primary-action" onClick={() => { setMessages([{ role: "assistant", content: `هَيَّا نَتَدَرَّبُ عَلَى مَوْضُوعِ ${currentExample.title}. تَفَضَّلْ وَابْدَأِ الْحِوَارَ!` }]); setTab("chat"); setSelectedExample(null); setEvaluation(null); setVocabulary([]); }}>Praktikkan dengan AI <ArrowLeft size={16} /></button></div> : <div className="example-grid">{examples.map((item) => <button className="example-card" key={item.id} onClick={() => setSelectedExample(item.id)}><span className="example-emoji">{item.icon}</span><span className="example-level">{item.level}</span><h3>{item.title}</h3><p>{item.subtitle}</p><small>{item.turns.length} baris dialog <ArrowLeft size={13} /></small></button>)}</div>}</div>}

          {tab === "history" && <div className="content-page"><div className="eyebrow">PERJALANAN BELAJARMU</div><h1>Riwayat percakapan</h1><p className="page-subtitle">Semua sesi tersimpan otomatis di browser perangkat ini.</p>{history.length ? <div className="history-list">{history.map((session) => <div className="history-item" key={session.id}><div className="history-icon"><MessageCircle size={19} /></div><div className="history-info"><b>{session.title}</b><small>{new Date(session.date).toLocaleString("id-ID")} · Level {session.level} · {personas.find((p) => p.id === session.persona)?.name || "AI"}</small></div>{session.evaluation && <span className="history-score">{session.evaluation.overall}/100</span>}<button onClick={() => loadSession(session)}>Buka</button><button className="delete-btn" onClick={() => setHistory((old) => old.filter((x) => x.id !== session.id))}><Trash2 size={15} /></button></div>)}</div> : <div className="empty-page"><History size={32} /><b>Belum ada riwayat</b><p>Mulai percakapan pertamamu dan hasilnya akan muncul di sini.</p><button className="primary-action" onClick={() => setTab("chat")}>Mulai belajar</button></div>}</div>}

          {tab === "vocabulary" && <div className="content-page"><div className="eyebrow">KUMPULAN KATA BARU</div><h1>Kosakata saya</h1><p className="page-subtitle">Kosakata yang dikumpulkan dari percakapan-percakapanmu.</p>{history.flatMap((s) => s.vocabulary || []).filter((v, i, a) => a.findIndex((x) => x.word === v.word) === i).length ? <div className="vocab-grid">{history.flatMap((s) => s.vocabulary || []).filter((v, i, a) => a.findIndex((x) => x.word === v.word) === i).map((word) => <div className="vocab-card" key={word.word}><b>{word.word}</b><span>{word.meaning}</span><p>{word.example}</p><button onClick={() => speak(word.word)}><Volume2 size={14} /> Dengarkan</button></div>)}</div> : <div className="empty-page"><Languages size={32} /><b>Belum ada kosakata tersimpan</b><p>AI akan mengumpulkan kosakata baru setelah kamu berlatih.</p><button className="primary-action" onClick={() => setTab("chat")}>Mulai percakapan</button></div>}</div>}

          {tab === "progress" && <div className="content-page"><div className="eyebrow">PANTAU PERKEMBANGAN</div><h1>Evaluasi kemampuan</h1><p className="page-subtitle">Ringkasan penilaian dari sesi percakapan yang tersimpan.</p><div className="progress-overview"><div className="progress-stat"><span>Total sesi</span><b>{history.length}</b></div><div className="progress-stat"><span>Rata-rata skor</span><b>{history.filter((s) => s.evaluation).length ? Math.round(history.reduce((sum, s) => sum + (s.evaluation?.overall || 0), 0) / history.filter((s) => s.evaluation).length) : "—"}</b></div><div className="progress-stat"><span>Kosakata unik</span><b>{new Set(history.flatMap((s) => s.vocabulary || []).map((v) => v.word)).size}</b></div></div><div className="history-list">{history.filter((s) => s.evaluation).map((s) => <div className="history-item" key={s.id}><div className="history-icon"><ChartNoAxesColumnIncreasing size={19} /></div><div className="history-info"><b>{s.title}</b><small>{new Date(s.date).toLocaleDateString("id-ID")} · Level {s.level}</small></div><span className="history-score">{s.evaluation?.overall}/100</span><button onClick={() => loadSession(s)}>Lihat sesi</button></div>)}</div></div>}
        </section>
      </div>
      <footer className="app-footer"><b>حِوَارِي HIWARI</b><span>Belajar bahasa Arab, satu percakapan setiap hari.</span><span>Made with ♡ for curious learners</span></footer>
    </main>
  );
}
