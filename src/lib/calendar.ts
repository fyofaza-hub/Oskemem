import type { CityEvent } from "@/types";
import { tr } from "@/i18n/runtime";

const pad = (value: number) => String(value).padStart(2, "0");

const toLocalStamp = (date: Date) =>
  `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(
    date.getHours(),
  )}${pad(date.getMinutes())}00`;

const escapeIcs = (value: string) =>
  value
    .replaceAll("\\", "\\\\")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,")
    .replaceAll("\n", "\\n");

/**
 * Скачивает демонстрационное событие как .ics — работает без сервера.
 * В описании явно указано, что это пример, а не подтверждённая афиша.
 */
export function downloadEventIcs(event: CityEvent, placeName: string) {
  const start = new Date(event.dateISO);
  const [hours, minutes] = event.endTime.split(":").map(Number);
  const end = new Date(start);
  end.setHours(hours, minutes, 0, 0);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Oskemen Culture//Demo//RU",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.id}@oskemen-culture.demo`,
    `DTSTAMP:${toLocalStamp(new Date())}`,
    `DTSTART:${toLocalStamp(start)}`,
    `DTEND:${toLocalStamp(end)}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    `LOCATION:${escapeIcs(`${placeName}, Өскемен`)}`,
    `DESCRIPTION:${escapeIcs(
      `${event.description}\n\n${tr(
        "Событие Oskemen Culture — проверяйте программу и условия у организатора.",
      )}`,
    )}`,
    "STATUS:TENTATIVE",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `oskemen-${event.id.replace(/^event-/, "")}.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
