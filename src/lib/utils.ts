import { clsx, type ClassValue } from "clsx";
import { currentLanguage, localeFor, tr, type Language } from "@/i18n/runtime";

export const cn = (...inputs: ClassValue[]) => clsx(inputs);

export const uid = (prefix = "id") => {
  const value =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${value}`;
};

const kkMonthsLong = [
  "қаңтар",
  "ақпан",
  "наурыз",
  "сәуір",
  "мамыр",
  "маусым",
  "шілде",
  "тамыз",
  "қыркүйек",
  "қазан",
  "қараша",
  "желтоқсан",
];

const kkMonthsShort = [
  "қаң.",
  "ақп.",
  "нау.",
  "сәу.",
  "мам.",
  "мау.",
  "шіл.",
  "там.",
  "қыр.",
  "қаз.",
  "қар.",
  "жел.",
];

const kkMonthsFrom = [
  "қаңтарынан",
  "ақпанынан",
  "наурызынан",
  "сәуірінен",
  "мамырынан",
  "маусымынан",
  "шілдесінен",
  "тамызынан",
  "қыркүйегінен",
  "қазанынан",
  "қарашасынан",
  "желтоқсанынан",
];

const ruMonthsGenitive = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];

const kkWeekdaysShort = ["жс", "дс", "сс", "ср", "бс", "жм", "сб"];
const kkWeekdaysLong = [
  "жексенбі",
  "дүйсенбі",
  "сейсенбі",
  "сәрсенбі",
  "бейсенбі",
  "жұма",
  "сенбі",
];

/**
 * Chromium и некоторые другие браузеры не содержат данных казахской локали
 * и показывают «M11 1» или «Sun». Форматируем даты сами, чтобы казахская
 * версия выглядела одинаково в любом браузере.
 */
const formatKazakhDate = (date: Date, options: Intl.DateTimeFormatOptions) => {
  const weekday =
    options.weekday === "long"
      ? kkWeekdaysLong[date.getDay()]
      : options.weekday
        ? kkWeekdaysShort[date.getDay()]
        : "";
  const day = options.day
    ? options.day === "2-digit"
      ? String(date.getDate()).padStart(2, "0")
      : String(date.getDate())
    : "";
  const month =
    options.month === "long"
      ? kkMonthsLong[date.getMonth()]
      : options.month === "short"
        ? kkMonthsShort[date.getMonth()]
        : "";
  const datePart = [day, month].filter(Boolean).join(" ");
  const yearPart = options.year ? String(date.getFullYear()) : "";
  return [weekday, [datePart, yearPart].filter(Boolean).join(" ")].filter(Boolean).join(", ");
};

const isKazakh = () => currentLanguage() === "kk";

const capitalizeFirst = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export const formatDate = (iso: string, options?: Intl.DateTimeFormatOptions) => {
  const date = new Date(iso);
  const resolved = options ?? { day: "numeric", month: "long" };
  const supportedMonth =
    !resolved.month || resolved.month === "long" || resolved.month === "short";
  if (
    isKazakh() &&
    supportedMonth &&
    (resolved.weekday || resolved.day || resolved.month || resolved.year)
  ) {
    const formatted = formatKazakhDate(date, resolved);
    return resolved.weekday ? capitalizeFirst(formatted) : formatted;
  }
  const formatted = new Intl.DateTimeFormat(localeFor(), resolved).format(date);
  return resolved.weekday ? capitalizeFirst(formatted) : formatted;
};

export const formatDateShort = (iso: string) => {
  const date = new Date(iso);
  if (isKazakh()) return formatKazakhDate(date, { day: "2-digit", month: "short" });
  return new Intl.DateTimeFormat(localeFor(), { day: "2-digit", month: "short" }).format(date);
};

export const formatWeekday = (iso: string) => {
  const date = new Date(iso);
  if (isKazakh()) return kkWeekdaysShort[date.getDay()];
  return new Intl.DateTimeFormat(localeFor(), { weekday: "short" }).format(date);
};

/** «с апреля 2025» / «since April 2025» / «2025 жылдың сәуірінен бастап». */
export const formatJoinedDate = (iso: string) => {
  const date = new Date(iso);
  if (isKazakh()) {
    return `${date.getFullYear()} жылдың ${kkMonthsFrom[date.getMonth()]} бастап`;
  }
  if (currentLanguage() === "en") {
    const month = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date);
    return `since ${month}`;
  }
  return `с ${ruMonthsGenitive[date.getMonth()]} ${date.getFullYear()}`;
};

export const formatTime = (iso: string, time?: string) => {
  const formatter = new Intl.DateTimeFormat(localeFor(), {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (time) {
    const [hours, minutes] = time.split(":").map(Number);
    const date = new Date(iso);
    date.setHours(hours, minutes, 0, 0);
    return formatter.format(date);
  }
  return formatter.format(new Date(iso));
};

export const formatEventRange = (startISO: string, endTime: string) =>
  `${formatTime(startISO)}–${formatTime(startISO, endTime)}`;

export const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(1, Math.round(diff / 60000));
  if (isKazakh()) {
    if (minutes < 60) return `${minutes} минут бұрын`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} сағат бұрын`;
    const days = Math.round(hours / 24);
    if (days < 7) return `${days} күн бұрын`;
    return formatDate(iso, { day: "numeric", month: "long" });
  }
  const relative = new Intl.RelativeTimeFormat(localeFor(), { numeric: "auto" });
  if (minutes < 60) return relative.format(-minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (hours < 24) return relative.format(-hours, "hour");
  const days = Math.round(hours / 24);
  if (days < 7) return relative.format(-days, "day");
  return formatDate(iso, { day: "numeric", month: "long" });
};

export const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 6) return tr("Доброй ночи");
  if (hour < 12) return tr("Доброе утро");
  if (hour < 18) return tr("Добрый день");
  return tr("Добрый вечер");
};

export const getFirstName = (name: string) => name.split(" ")[0];

export const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

export const priceLabel = (level: number) => {
  if (level === 0) return tr("Бесплатно");
  return "₸".repeat(Math.min(level, 3));
};

type PluralForms = {
  ru: [string, string, string];
  en: [string, string];
  kk: string;
};

/**
 * Russian keeps three grammatical forms, English two, and Kazakh does not
 * change a noun after a numeral. Keeping the rules here avoids awkward
 * machine-translated plural forms in count labels.
 */
export const pluralWord = (count: number, forms: PluralForms) => {
  const language: Language = currentLanguage();
  if (language === "en") {
    return Math.abs(count) === 1 ? forms.en[0] : forms.en[1];
  }
  if (language === "kk") return forms.kk;
  const n = Math.abs(count) % 100;
  const n1 = n % 10;
  if (n > 10 && n < 20) return forms.ru[2];
  if (n1 > 1 && n1 < 5) return forms.ru[1];
  if (n1 === 1) return forms.ru[0];
  return forms.ru[2];
};

export const pluralizePlaces = (count: number) =>
  `${count} ${pluralWord(count, {
    ru: ["место", "места", "мест"],
    en: ["place", "places"],
    kk: "орын",
  })}`;

export const pluralizeStops = (count: number) =>
  `${count} ${pluralWord(count, {
    ru: ["остановка", "остановки", "остановок"],
    en: ["stop", "stops"],
    kk: "тоқтау",
  })}`;

export const pluralizeRoutes = (count: number) =>
  `${count} ${pluralWord(count, {
    ru: ["маршрут", "маршрута", "маршрутов"],
    en: ["route", "routes"],
    kk: "маршрут",
  })}`;

export const pluralizeEvents = (count: number) =>
  `${count} ${pluralWord(count, {
    ru: ["событие", "события", "событий"],
    en: ["event", "events"],
    kk: "оқиға",
  })}`;

export const pluralizePosts = (count: number) =>
  `${count} ${pluralWord(count, {
    ru: ["публикация", "публикации", "публикаций"],
    en: ["post", "posts"],
    kk: "жазба",
  })}`;

export const pluralizeComments = (count: number) =>
  `${count} ${pluralWord(count, {
    ru: ["комментарий", "комментария", "комментариев"],
    en: ["comment", "comments"],
    kk: "пікір",
  })}`;

const durationUnits: Record<Language, { hour: string; minute: string }> = {
  ru: { hour: "ч", minute: "мин" },
  kk: { hour: "сағ", minute: "мин" },
  en: { hour: "h", minute: "min" },
};

export const durationLabel = (minutes: number) => {
  const units = durationUnits[currentLanguage()];
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} ${units.minute}`;
  if (!rest) return `${hours} ${units.hour}`;
  return `${hours} ${units.hour} ${rest} ${units.minute}`;
};

export const haversine = (a: [number, number], b: [number, number]) => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earth = 6371;
  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * earth * Math.asin(Math.sqrt(h));
};

export const cartesianRoute = (points: [number, number][]) => {
  if (!points.length) return 0;
  let distance = 0;
  for (let i = 1; i < points.length; i += 1) {
    distance += haversine(points[i - 1], points[i]);
  }
  return Math.round(distance * 1.2 * 10) / 10;
};

export const addMinutes = (time: string, minutes: number) => {
  const [h, m] = time.split(":").map(Number);
  const total = (h * 60 + m + minutes + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};

export const normalize = (value: string) => value.toLowerCase().trim().replace(/ё/g, "е");

export const isToday = (iso: string) => {
  const date = new Date(iso);
  const now = new Date();
  return date.toDateString() === now.toDateString();
};

export const isThisWeekend = (iso: string) => {
  const date = new Date(iso);
  const day = date.getDay();
  return day === 0 || day === 6;
};

export const isWithinDays = (iso: string, days: number) => {
  const delta = new Date(iso).getTime() - Date.now();
  return delta >= 0 && delta <= days * 24 * 60 * 60 * 1000;
};

export const eventDateBadge = (iso: string) => ({
  day: formatDate(iso, { day: "2-digit" }),
  month: formatDate(iso, { month: "short" }).replace(".", ""),
  weekday: formatWeekday(iso).replace(".", ""),
});

export const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

export const shareLink = async (data: { title: string; text: string; url: string }) => {
  if (navigator.share) {
    try {
      await navigator.share(data);
      return "shared";
    } catch {
      return "cancelled";
    }
  }
  const copied = await copyToClipboard(data.url);
  return copied ? "copied" : "failed";
};

export const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error(tr("Не удалось прочитать файл")));
    reader.readAsDataURL(file);
  });

export const validateImageFile = (file: File) => {
  if (!file.type.startsWith("image/")) return tr("Можно загрузить только изображение");
  if (file.size > 6 * 1024 * 1024) return tr("Файл больше 6 МБ");
  return null;
};

export const compressImage = (file: File, maxWidth = 1200, quality = 0.82): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const scale = Math.min(1, maxWidth / image.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error(tr("Не удалось обработать изображение")));
          return;
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      image.onerror = () => reject(new Error(tr("Не удалось открыть изображение")));
      image.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error(tr("Не удалось прочитать файл")));
    reader.readAsDataURL(file);
  });

export const normalizeTime = (time: string) => {
  if (!/^\d{2}:\d{2}$/.test(time)) return "12:00";
  return time;
};
