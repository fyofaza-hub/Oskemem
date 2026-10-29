import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { track } from "@/lib/analytics";
import { tr } from "@/i18n/runtime";
import { matchPlaces, type VoiceMatchResult, type VoiceMatchReason } from "@/lib/voiceSearch";
import { useVoiceInput, type VoiceErrorCode } from "@/hooks/useVoiceInput";
import { categoryMap } from "@/data/categories";
import { Modal } from "@/components/ui/Modal";
import { Button, ButtonLink, IconButton } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";

const errorMessages: Record<VoiceErrorCode, string> = {
  "not-allowed": tr("Нет доступа к микрофону. Разрешите его в настройках браузера и попробуйте снова."),
  "no-speech": tr("Не удалось расслышать запрос. Подойдите ближе к микрофону и попробуйте ещё раз."),
  network: tr("Распознавание речи работает только при подключении к сети."),
  unknown: tr("Не получилось запустить распознавание речи."),
};

const reasonLabels: Record<VoiceMatchReason, string> = {
  query: tr("Откликается на ваш запрос"),
  category: tr("Совпадает с категорией из запроса"),
  interest: tr("Совпадает с вашими интересами"),
  companion: tr("Подходит для вашей компании"),
  budget: tr("Укладывается в бюджет из запроса"),
};

/**
 * Кнопка микрофона + диалог голосового подбора места.
 * Слушает запрос словами («кофе на двоих», «музей с ребёнком») и
 * подбирает место по совпадению с запросом и интересам профиля.
 */
export function VoiceSearchButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <IconButton
        icon="mic"
        label={tr("Голосовой подбор места")}
        variant="bordered"
        className={className}
        onClick={() => setOpen(true)}
      />
      <VoiceSearchModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

interface VoiceSearchModalProps {
  open: boolean;
  onClose: () => void;
}

export function VoiceSearchModal({ open, onClose }: VoiceSearchModalProps) {
  const { places, currentUser } = useApp();
  const navigate = useNavigate();
  const [result, setResult] = useState<VoiceMatchResult | null>(null);
  const [textQuery, setTextQuery] = useState("");
  const voice = useVoiceInput((transcript) => {
    const match = matchPlaces(transcript, places, currentUser?.interests ?? []);
    track("voice_match", { matched: !match.fallback, places_count: places.length });
    setResult(match);
  });

  useEffect(() => {
    if (open) return;
    setResult(null);
    setTextQuery("");
    voice.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const go = (path: string) => {
    onClose();
    navigate(path);
  };

  const matchByText = () => {
    const query = textQuery.trim();
    if (!query) return;
    voice.stop();
    const match = matchPlaces(query, places, currentUser?.interests ?? []);
    track("voice_match", { matched: !match.fallback, places_count: places.length });
    setResult(match);
  };

  const handleTextSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    matchByText();
  };

  const best = result?.best ?? null;
  const alternatives = result?.alternatives ?? [];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={tr("Голосовой подбор места")}
      description={tr("Скажите, чего хочется: «кофе на двоих», «музей с ребёнком», «прогулка на закате»…")}
      size="md"
    >
      <div className="p-4 sm:p-5">
        {!voice.supported ? (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-sunken px-3.5 py-3 text-meta leading-relaxed text-muted">
            <Icon name="info" size={15} className="mt-0.5 shrink-0" />
            {tr("В этом браузере нет распознавания речи. Попробуйте Chrome, Edge или Safari — или опишите запрос текстом ниже.")}
          </div>
        ) : null}

        {best ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-accent-soft px-3.5 py-2.5 text-sm leading-relaxed text-accent-ink">
              <p className="text-meta font-medium uppercase tracking-[0.08em] opacity-70">
                {result?.fallback ? tr("Совпало с вашими интересами") : tr("Ваш запрос")}
              </p>
              <p className="mt-0.5">«{result?.query}»</p>
            </div>

            <article className="card card-interactive overflow-hidden">
              <div className="relative h-40 w-full">
                <img src={best.place.image} alt={best.place.name} className="h-full w-full object-cover" />
                <div className="absolute inset-x-3 bottom-3 flex flex-wrap gap-1.5">
                  {best.reasons.slice(0, 3).map((reason) => (
                    <span key={reason} className="rounded-full bg-surface/90 px-2.5 py-1 text-meta font-medium text-fg backdrop-blur-sm">
                      {reasonLabels[reason]}
                    </span>
                  ))}
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-display text-lg font-semibold text-fg">{best.place.name}</h3>
                    <p className="mt-0.5 text-meta text-muted">
                      {categoryMap[best.place.category].shortLabel} · {best.place.address}
                    </p>
                  </div>
                </div>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">{best.place.shortDescription}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="primary" size="sm" iconRight="arrowRight" onClick={() => go(`/guide?place=${best.place.id}`)}>
                    {tr("Открыть в гиде")}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon="refresh"
                    onClick={() => {
                      setResult(null);
                      voice.reset();
                      voice.start();
                    }}
                  >
                    {tr("Спросить ещё раз")}
                  </Button>
                </div>
              </div>
            </article>

            {alternatives.length ? (
              <div>
                <p className="mb-2 text-meta font-medium text-muted">{tr("Другие варианты")}</p>
                <div className="space-y-1">
                  {alternatives.map((match) => (
                    <button
                      key={match.place.id}
                      type="button"
                      onClick={() => go(`/guide?place=${match.place.id}`)}
                      className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      <img src={match.place.image} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-fg">{match.place.name}</span>
                        <span className="block truncate text-meta text-muted">
                          {categoryMap[match.place.category].shortLabel} · {match.place.address}
                        </span>
                      </span>
                      <Icon name="chevronRight" size={15} className="shrink-0 text-faint" />
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-col items-center pt-2 pb-1">
              <motion.button
                type="button"
                onClick={() => voice.start()}
                disabled={!voice.supported}
                aria-label={tr("Нажмите и говорите")}
                animate={voice.listening ? { scale: [1, 1.07, 1] } : { scale: 1 }}
                transition={voice.listening ? { duration: 1.1, repeat: Infinity, ease: "easeInOut" } : undefined}
                className="flex h-20 w-20 items-center justify-center rounded-full bg-accent text-white shadow-raised transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:pointer-events-none disabled:opacity-40"
              >
                <Icon name="mic" size={28} />
              </motion.button>

              <p className="mt-4 text-sm font-medium text-fg">
                {voice.listening ? tr("Слушаю…") : tr("Нажмите на микрофон и скажите, куда хочется")}
              </p>
              <p className="mt-1 min-h-5 text-center text-meta text-muted">
                {voice.interimText || (
                  voice.listening ? tr("Говорите — я слушаю ваш запрос") : voice.supported ? tr("Одна фраза — например, «парк для прогулки с ребёнком»") : tr("Распознавание речи недоступно")
                )}
              </p>

              {voice.error ? (
                <div
                  role="alert"
                  className="mt-3 w-full rounded-xl border border-danger/25 bg-danger-soft px-3.5 py-2.5 text-sm leading-relaxed text-danger-ink"
                >
                  {errorMessages[voice.error]}
                </div>
              ) : null}

              {voice.listening ? (
                <Button variant="secondary" size="sm" icon="close" className="mt-3" onClick={voice.stop}>
                  {tr("Закончить запись")}
                </Button>
              ) : null}
            </div>

            <div className="border-t border-line pt-4">
              <p className="field-label">{tr("Или опишите запрос текстом")}</p>
              <form className="flex gap-2" onSubmit={handleTextSubmit}>
                <Input
                  value={textQuery}
                  onChange={(event) => setTextQuery(event.target.value)}
                  placeholder={tr("Например: тихая кофейня на двоих")}
                  leadingIcon="search"
                  wrapperClassName="flex-1"
                  aria-label={tr("Запрос текстом")}
                />
                <Button type="submit" variant="secondary" size="md" iconRight="arrowRight">
                  {tr("Подобрать")}
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
