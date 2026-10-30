/**
 * AI-Гид — плавающий чат-виджет со спутником по Өскемену.
 *
 * Запросы идут напрямую в Groq (OpenAI-совместимый API, модель
 * llama-3.1-8b-instant) с ключом VITE_GROQ_API_KEY из .env.local.
 * Внимание: любой ключ с префиксом VITE_ попадает в клиентский бандл и виден
 * в DevTools — это решение для демо/личного проекта; для продакшена стоит
 * проксировать запрос через serverless-функцию и держать ключ на сервере.
 *
 * Панель построена на семантических токенах темы (surface / line / accent),
 * поэтому сочетается с дизайном сайта и в тёмной, и в светлой теме
 * (тёмная — тема по умолчанию).
 */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn, uid } from "@/lib/utils";
import { categoryMap } from "@/data/categories";
import { places } from "@/data/places";
import { currentLanguage, tr, type Language } from "@/i18n/runtime";
import { IconButton } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Icon, type IconName } from "@/components/ui/Icon";

type ChatRole = "user" | "assistant";

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
}

const STORAGE_KEY = "oskemen-ai-chat";
/** Компактная история: и для показа, и для отправки модели. */
const MAX_MESSAGES = 24;
const INPUT_MAX_LENGTH = 1000;
/** Единая для проекта кривая ease-smooth (tailwind.config.ts). */
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Groq (OpenAI-совместимый API): эндпоинт и текущая быстрая чат-модель.
 *  Заявленная в ТЗ llama-3.1-8b-instant Гроком выведена из списка доступных
 *  (проверено /models по ключу) — взята qwen3.8-27b: быстрый чистый русский,
 *  без «рассуждений» в поле content. */
const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "qwen/qwen3.8-27b";
const GROQ_TIMEOUT_MS = 30_000;

// Ключ задаётся в .env.local (см. .env.example и раздел README «AI-гид (Groq)»).
const groqApiKey = import.meta.env.VITE_GROQ_API_KEY?.trim();
const groqConfigured = Boolean(groqApiKey);

/** Восстановление последнего диалога после перезагрузки страницы. */
function loadHistory(): ChatMessage[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const restored: ChatMessage[] = [];
    for (const item of parsed) {
      if (item && (item.role === "user" || item.role === "assistant") && typeof item.content === "string") {
        restored.push({
          id: typeof (item as { id?: unknown }).id === "string" ? (item.id as string) : uid("msg"),
          role: item.role,
          content: item.content,
        });
      }
    }
    return restored.slice(-MAX_MESSAGES);
  } catch {
    return [];
  }
}

/** Язык ответа гида следует языку интерфейса сайта. */
const LANGUAGE_INSTRUCTIONS: Record<Language, string> = {
  ru: "Отвечай на русском языке.",
  kk: "Отвечай на казахском языке простыми словами; если не хватает точных казахских формулировок, можно дать пояснение на русском в скобках.",
  en: "Always reply in English.",
};

/** Компактный каталог мест из гида сайта: имя (район) — категория · бюджет. */
function buildPlaceCatalog(): string {
  return places
    .slice(0, 60)
    .map((place) => {
      const category = categoryMap[place.category]?.shortLabel;
      const price = place.priceLevel > 0 ? ` · ${"₸".repeat(place.priceLevel)}` : "";
      return `- ${place.name} (${place.district}) — ${category ?? place.category}${price}`;
    })
    .join("\n");
}

/**
 * Системный промпт гида Өскемена.
 * Сайт не публикует выдуманные адреса, цены и часы работы — гид следует той же
 * политике честности, а в ответах советует реальные точки из каталога.
 */
function buildSystemPrompt(): string {
  return [
    "Ты — «AI-Гид Өскемен», дружелюбный и эрудированный гид по Усть-Каменогорску (каз. Өскемен) — городу на слиянии Иртыша и Ульбы, основанному в 1720 году как крепость, «Восточные ворота Казахстана».",
    "Ты встроен в сайт Oskemen Culture — социальное пространство о местах, событиях и маршрутах города.",
    "",
    "Твоя задача — помогать туристам и горожанам находить интересные места, события и маршруты и рассказывать об истории и культуре города: что посмотреть, куда сходить вечером, что попробовать, как спланировать день. Подсказывай время и порядок посещения, что удобно объединить в один маршрут.",
    "",
    "Ты также помогаешь пользоваться самим сайтом Oskemen Culture: если пользователь спрашивает, как что-то сделать на сайте, отвечай точным путём — раздел, шаги по порядку и что получится. Опирайся только на этот список возможностей; того, чего в списке нет, на сайте нет — не выдумывай:",
    "- «Гид» (раздел «Куда сходить» → «Гид»): каталог всех мест города; поиск по названию и голосовой поиск; фильтры по категории (кафе, природа, досуг, культура, спорт, места, отдых), району, бюджету и компании; в карточке места — адрес, описание и уровень бюджета, сердечко сохраняет место в избранное, кнопка «В маршрут» добавляет его в маршрут.",
    "- «Карта» (раздел «Карта»): все места на интерактивной карте от OpenStreetMap, удобно для выбора точек рядом.",
    "- «Маршруты» (раздел «Маршруты» → «Собрать маршрут» или собственный сценарий из любимых мест): чтобы создать свой маршрут, открой конструктор, добавьте хотя бы две точки (из гида или карты), расставьте порядок и укажите время остановок; после сохранения маршрут появится в профиле и получит ссылку, которой можно поделиться. В разделе есть и готовые маршруты города.",
    "- «Собрать вечер» (раздел «План»): подбор вечера за пять шагов — с кем идёте, бюджет, впечатление, готовый сценарий с порядком и временем, ссылка для друзей.",
    "- «Афиша» (раздел «События»): события города от текущей даты; перед посещением сверяйте детали и программу с организатором, даты не выдумывай.",
    "- «Лента» (раздел «Лента»): публикации горожан о местах; своё место или совет можно рассказать городу и появиться в ленте.",
    "- «Профиль»: избранное, свои публикации, маршруты и настройки.",
    "- Поиск в шапке (клавиши Ctrl+K) находит место или событие из любого раздела.",
    "",
    "Знания о городе, на которые можно опираться:",
    "- центр и исторические кварталы старого города (район Стрелки): историко-краеведческий музей, этнографический музей под открытым небом, театры и концертные площадки, городская мечеть, областная библиотека;",
    "- набережная Иртыша и парки (Жамбыла, Кайсенова) — любимые прогулочные маршруты; зоопарк, бассейн и спортивные объекты на левом берегу;",
    "- активная жизнь: городская арена с хоккейными матчами (клуб «Казцинк-Торпедо»), спортивные комплексы, рынки и кафе центра;",
    "- поездки по региону: предгорья Алтая рядом с городом, Рахмановские ключи, Катон-Карагайский и Западно-Алтайский заповедники, озеро Зайсан.",
    "",
    "Ниже — реальные точки каталога сайта: имя (район) — категория · бюджет. Рекомендуй именно их, когда они подходят; в ответах указывай название и район, без выдуманных номеров домов, часов работы и цен.",
    "",
    buildPlaceCatalog(),
    "",
    "Правила честности:",
    "- не придумывай точные адреса домов, часы работы, цены и телефоны; если не уверен в детали, давай общий ориентир и советуй свериться в разделе «Гид» или у самого места;",
    "- описывай только разделы и функции из списка выше; если пользователь просит то, чего на сайте нет, честно скажи об этом и предложи ближайшую альтернативу;",
    "- даты и программы событий не выдумывай: предлагай проверить актуальную афишу у организатора;",
    "- если вопрос далеко от города и путешествий, мягко верни разговор к Өскемену.",
    "",
    "Стиль: живой и тёплый, обращение на «вы», по делу; короткие абзацы и простые списки обычным текстом (— или •), без markdown-символов (**, ###) и ссылок — интерфейс рендерит только строки. Обычный ответ — 3–6 пунктов; длинные планы только по явной просьбе.",
    "",
    LANGUAGE_INSTRUCTIONS[currentLanguage()],
  ].join("\n");
}

/** Аккуратно достаём текст первого варианта ответа Groq; любые расхождения считаем пустым ответом.
 *  Модели любят подсовывать markdown-украшения — интерфейс рендерит чистый текст,
 *  поэтому ** и ### снимаем. */
function extractReplyContent(payload: unknown): string {
  if (typeof payload !== "object" || payload === null) return "";
  const choices = (payload as { choices?: unknown }).choices;
  if (!Array.isArray(choices)) return "";
  const first = choices[0];
  if (typeof first !== "object" || first === null) return "";
  const message = (first as { message?: unknown }).message;
  if (typeof message !== "object" || message === null) return "";
  const content = (message as { content?: unknown }).content;
  if (typeof content !== "string") return "";
  return content
    .replace(/\*\*/g, "")
    .replace(/^#{1,6}\s+/gm, "")
    .trim();
}

/**
 * Запрос к Groq: system-промпт + история диалога.
 * Таймаут и сетевые ошибки превращаются в исключение — send() покажет
 * сообщение «Не удалось получить ответ гида» в виде пузыря.
 */
async function requestGuideReply(messages: Array<{ role: ChatRole; content: string }>): Promise<string> {
  if (!groqConfigured || !groqApiKey) throw new Error("groq: не настроен ключ VITE_GROQ_API_KEY");

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), GROQ_TIMEOUT_MS);

  try {
    const response = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: "system", content: buildSystemPrompt() }, ...messages],
        temperature: 0.7,
        max_tokens: 900,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      // 401 — неверный ключ; 429 — превышен лимит запросов; 5xx — сбой Groq.
      throw new Error(`groq: HTTP ${response.status}`);
    }

    const payload: unknown = await response.json();
    const content = extractReplyContent(payload);
    if (!content) throw new Error("groq: пустой ответ");
    return content;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw new Error("groq: таймаут");
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

/** Состояние чата: сообщения, черновик, отправка. Общее для плавающего виджета и встроенной панели. */
interface AIChatState {
  messages: ChatMessage[];
  sending: boolean;
  draft: string;
  setDraft: (value: string) => void;
  /** content — готовый текст (подсказки/иные сценарии); без аргумента отправляется черновик. */
  send: (content?: string) => void;
  reset: () => void;
}

function useAIChat(): AIChatState {
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadHistory());
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");
  const messagesRef = useRef<ChatMessage[]>(messages);
  const requestIdRef = useRef(0);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Диалог живёт в localStorage: после перезагрузки страницы он возвращается.
  useEffect(() => {
    try {
      const recent = messages.slice(-MAX_MESSAGES);
      if (recent.length) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(recent));
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Хранилище может быть недоступно — чат просто не переживёт перезагрузку.
    }
  }, [messages]);

  const send = useCallback(
    (content?: string) => {
      const body = (content ?? draft).trim();
      if (!body || sending) return;
      if (content === undefined) setDraft("");

      const history: ChatMessage[] = [
        ...messagesRef.current,
        { id: uid("msg"), role: "user", content: body },
      ];
      setMessages(history);
      setSending(true);

      // Номер запроса позволяет отбросить запоздавший ответ,
      // если пользователь успел нажать «Начать заново».
      const request = ++requestIdRef.current;
      requestGuideReply(history.map(({ role, content: text }) => ({ role, content: text })))
        .then((reply) => {
          if (requestIdRef.current !== request) return;
          setMessages((prev) => [
            ...prev,
            { id: uid("msg"), role: "assistant", content: reply },
          ]);
        })
        .catch(() => {
          if (requestIdRef.current !== request) return;
          setMessages((prev) => [
            ...prev,
            { id: uid("msg"), role: "assistant", content: tr("Не удалось получить ответ гида") },
          ]);
        })
        .finally(() => {
          if (requestIdRef.current === request) setSending(false);
        });
    },
    [draft, sending],
  );

  const reset = useCallback(() => {
    requestIdRef.current += 1;
    setMessages([]);
    setDraft("");
    setSending(false);
  }, []);

  return { messages, sending, draft, setDraft, send, reset };
}

const bubbleBase =
  "max-w-[86%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed";

function Bubble({ role, content, reduced }: { role: ChatRole; content: string; reduced: boolean }) {
  return (
    <motion.div
      initial={reduced ? { opacity: 1 } : { opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: EASE }}
      className={cn(
        bubbleBase,
        role === "user" ? "self-end bg-accent text-white shadow-glow-sm" : "self-start bg-sunken text-fg",
      )}
    >
      {content}
    </motion.div>
  );
}

function TypingBubble({ reduced }: { reduced: boolean }) {
  return (
    <motion.div
      initial={reduced ? { opacity: 1 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: EASE }}
      className="self-start rounded-2xl bg-sunken px-4 py-3"
      aria-label={tr("Гид печатает…")}
    >
      <span className="flex items-center gap-1.5" aria-hidden="true">
        {[0, 1, 2].map((index) => (
          <motion.span
            key={index}
            className="h-1.5 w-1.5 rounded-full bg-muted"
            animate={reduced ? undefined : { y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: index * 0.18, ease: "easeInOut" }}
          />
        ))}
      </span>
    </motion.div>
  );
}

/** Приветствие и подсказки — только для пустого диалога, они не попадают в историю. */
function Greeting({ chat }: { chat: AIChatState }) {
  const suggestions: Array<{ icon: IconName; label: string }> = [
    { icon: "calendarDays", label: tr("Куда сходить в выходные?") },
    { icon: "camera", label: tr("Что посмотреть в городе?") },
    { icon: "coffee", label: tr("Где вкусно поесть?") },
    { icon: "wave", label: tr("Расскажи про Иртыш и набережную") },
  ];

  return (
    <>
      <div className={cn(bubbleBase, "self-start bg-sunken text-fg")}>
        {tr("Привет! Я — AI-гид по Өскемену. Подскажу, куда сходить, что посмотреть и где вкусно поесть в Усть-Каменогорске.")}
      </div>
      <div className="flex flex-wrap gap-2 pt-1">
        {suggestions.map((item) => (
          <Chip key={item.label} icon={item.icon} onClick={() => chat.send(item.label)}>
            {item.label}
          </Chip>
        ))}
      </div>
    </>
  );
}

/** Сообщение о том, что гид не подключён: показываем вместо приветствия. */
function NotConfiguredNotice() {
  return (
    <div
      role="status"
      className="flex items-start gap-2.5 rounded-2xl border border-line bg-accent-soft px-3.5 py-3 text-[13px] leading-relaxed text-accent-ink"
    >
      <Icon name="info" size={16} className="mt-0.5 shrink-0" />
      <span>
        {tr("AI-гид пока не подключён: добавьте VITE_GROQ_API_KEY в .env и перезапустите сервер.")}
      </span>
    </div>
  );
}

/**
 * Панель чата: шапка, поток сообщений, ввод.
 * Самостоятельна — её можно встроить в любом разделе и без плавающей кнопки.
 */
export function ChatPanel({ chat, onClose }: { chat: AIChatState; onClose?: () => void }) {
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const reduced = useReducedMotion() === true;

  // Поток сообщений всегда показывается от конца.
  useLayoutEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [chat.messages.length, chat.sending]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, []);

  // Автовысота поля: одна строка, растёт до ~5 строк.
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 120)}px`;
  }, [chat.draft]);

  // Enter — отправить, Shift+Enter — новая строка, IME (составление) не прерываем.
  const onKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    chat.send();
  };

  const empty = chat.messages.length === 0;
  const placeholder = tr("Спросите гида…");

  return (
    <section
      aria-label={tr("AI-гид Өскемен")}
      onKeyDown={(event) => {
        // Esc закрывает плавающий виджет; за пределы панели событие не уходит.
        if (event.key === "Escape") {
          event.stopPropagation();
          onClose?.();
        }
      }}
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-line bg-surface/85 backdrop-blur-2xl shadow-raised"
    >
      <header className="flex shrink-0 items-center gap-3 border-b border-line px-4 py-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-b from-accent to-accent-hover text-white shadow-glow-sm">
          <Icon name="guide" size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-[15px] font-semibold tracking-[-0.01em]">
            {tr("AI-гид Өскемен")}
          </h3>
          <p className="flex items-center gap-1.5 text-meta text-muted">
            <span aria-hidden="true" className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            {chat.sending ? tr("Гид печатает…") : tr("Гид по местам")}
          </p>
        </div>
        <IconButton
          icon="refresh"
          label={tr("Начать заново")}
          size="sm"
          disabled={!chat.messages.length}
          onClick={chat.reset}
        />
        {onClose ? <IconButton icon="close" label={tr("Закрыть")} size="sm" onClick={onClose} /> : null}
      </header>

      <div ref={listRef} role="log" aria-live="polite" className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {!groqConfigured ? (
          <NotConfiguredNotice />
        ) : empty ? (
          <div className="flex flex-col gap-2.5">
            <Greeting chat={chat} />
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {chat.messages.map((message) => (
              <Bubble key={message.id} role={message.role} content={message.content} reduced={reduced} />
            ))}
            {chat.sending ? <TypingBubble reduced={reduced} /> : null}
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-line p-3">
        <div
          className={cn(
            "flex items-end gap-2 rounded-2xl border border-line bg-sunken pl-3.5 pr-1.5 transition-colors duration-200 focus-within:border-accent",
            !groqConfigured && "pointer-events-none opacity-50",
          )}
        >
          <textarea
            ref={inputRef}
            rows={1}
            value={chat.draft}
            maxLength={INPUT_MAX_LENGTH}
            disabled={!groqConfigured}
            onChange={(event) => chat.setDraft(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            aria-label={placeholder}
            className="max-h-[120px] min-h-[36px] w-full min-w-0 flex-1 resize-none bg-transparent py-2 text-[14px] leading-relaxed outline-none focus-visible:outline-none placeholder:text-faint"
          />
          <button
            type="button"
            onClick={() => chat.send()}
            disabled={!groqConfigured || chat.sending || !chat.draft.trim()}
            aria-label={tr("Отправить сообщение")}
            className="mb-1 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent text-white transition hover:bg-accent-hover active:scale-95 disabled:pointer-events-none disabled:opacity-40"
          >
            <Icon name="send" size={16} />
          </button>
        </div>
        <p className="px-1 pb-1 pt-2 text-[11px] leading-snug text-faint">
          {tr("ИИ может ошибаться в деталях — актуальные часы работы и цены уточняйте у самого места.")}
        </p>
      </div>
    </section>
  );
}

/**
 * Плавающий AI-виджет: кнопка с компасом в углу экрана и раскрывающаяся панель.
 * Кнопка живёт выше мобильной навигации (bottom 4.75rem + safe-area),
 * на рабочих столах — в штатном нижнем правом углу.
 */
export function AIChat() {
  const [open, setOpen] = useState(false);
  const chat = useAIChat();
  const reduced = useReducedMotion() === true;

  return (
    <div className="fixed bottom-[calc(4.75rem_+_env(safe-area-inset-bottom))] right-4 z-[60] h-14 w-14 sm:right-6 lg:bottom-6">
      <AnimatePresence>
        {open ? (
          <motion.div
            key="ai-chat-panel"
            initial={reduced ? { opacity: 1 } : { opacity: 0, y: 18, scale: 0.97 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.97 }}
            transition={{ duration: 0.28, ease: EASE }}
            style={{ transformOrigin: "bottom right" }}
            className="absolute bottom-[calc(100%_+_0.75rem)] right-0 h-[min(600px,calc(100svh_-_13rem))] min-h-[320px] w-[calc(100vw_-_2rem)] sm:w-[396px]"
          >
            <ChatPanel chat={chat} onClose={() => setOpen(false)} />
          </motion.div>
        ) : (
          <motion.button
            key="ai-chat-fab"
            type="button"
            onClick={() => setOpen(true)}
            aria-label={tr("Открыть AI-гида")}
            initial={false}
            exit={{ opacity: 0, scale: 0.85 }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-b from-accent to-accent-hover text-white shadow-glow-fab"
          >
            <Icon name="guide" size={24} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
