import { useCallback, useEffect, useRef, useState } from "react";
import { localeFor } from "@/i18n/runtime";

interface VoiceRecognitionResultItem {
  isFinal: boolean;
  0: { transcript: string };
}

interface VoiceRecognitionEvent {
  resultIndex: number;
  results: { length: number; [index: number]: VoiceRecognitionResultItem };
}

interface VoiceRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: VoiceRecognitionEvent) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
}

type VoiceRecognitionCtor = new () => VoiceRecognition;

const getRecognitionCtor = (): VoiceRecognitionCtor | null => {
  if (typeof window === "undefined") return null;
  const scope = window as unknown as Record<string, unknown>;
  return (scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null) as VoiceRecognitionCtor | null;
};

export const isVoiceInputSupported = () => Boolean(getRecognitionCtor());

export type VoiceErrorCode = "not-allowed" | "no-speech" | "network" | "unknown";

const toErrorCode = (raw?: string): VoiceErrorCode => {
  if (raw === "not-allowed" || raw === "service-not-allowed") return "not-allowed";
  if (raw === "no-speech" || raw === "audio-capture") return "no-speech";
  if (raw === "network") return "network";
  return "unknown";
};

export interface VoiceInputState {
  /** Web Speech API доступен в этом браузере. */
  supported: boolean;
  /** Сейчас идёт запись. */
  listening: boolean;
  /** Финально распознанный текст последнего запроса. */
  finalText: string;
  /** Промежуточный (незафиксированный) текст во время записи. */
  interimText: string;
  error: VoiceErrorCode | null;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

/**
 * Голосовой ввод через Web Speech API (Chrome/Safari, включая webkit-префикс).
 * Одна фраза на нажатие: continuous = false, interimResults = true.
 */
export function useVoiceInput(onTranscript?: (transcript: string) => void): VoiceInputState {
  const [listening, setListening] = useState(false);
  const [finalText, setFinalText] = useState("");
  const [interimText, setInterimText] = useState("");
  const [error, setError] = useState<VoiceErrorCode | null>(null);
  const recognitionRef = useRef<VoiceRecognition | null>(null);
  const onTranscriptRef = useRef(onTranscript);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  });

  useEffect(
    () => () => {
      try {
        recognitionRef.current?.abort();
      } catch {
        /* recognition уже освобождён */
      }
    },
    [],
  );

  const stop = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      /* recognition уже остановлен */
    }
  }, []);

  const reset = useCallback(() => {
    setFinalText("");
    setInterimText("");
    setError(null);
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;
    try {
      recognitionRef.current?.abort();
    } catch {
      /* прошлый recognition уже освобождён */
    }
    setError(null);
    setFinalText("");
    setInterimText("");

    const recognition = new Ctor();
    recognitionRef.current = recognition;
    recognition.lang = localeFor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let interim = "";
      let final = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (result.isFinal) final += result[0].transcript;
        else interim += result[0].transcript;
      }
      if (final) {
        const text = final.trim();
        setFinalText(text);
        setInterimText("");
        setListening(false);
        if (text) onTranscriptRef.current?.(text);
      } else if (interim) {
        setInterimText(interim.trim());
      }
    };

    recognition.onerror = (event) => {
      setError(toErrorCode(event.error));
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    setListening(true);
    try {
      recognition.start();
    } catch {
      setListening(false);
      setError("unknown");
    }
  }, []);

  return { supported: isVoiceInputSupported(), listening, finalText, interimText, error, start, stop, reset };
}
