import type { CityEvent } from "@/types";

const atFuture = (days: number, hours: number, minutes = 0) => {
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

/**
 * Афиша города. Даты рассчитываются от текущего дня, чтобы список не устаревал.
 * Программу и условия стоит уточнять у организатора.
 */
export const seedEvents: CityEvent[] = [
  {
    id: "event-museum-night",
    title: "Вечер в краеведческом музее",
    description:
      "Вечерняя экскурсия по постоянной экспозиции и разговор о том, как менялся город. Хороший повод зайти в музей после работы.",
    image: "/images/books.webp",
    category: "culture",
    dateISO: atFuture(3, 18, 30),
    endTime: "20:30",
    placeId: "place-history-museum",
    priceLabel: "Условия уточняются",
    demo: true,
    savedBy: [],
  },
  {
    id: "event-sunset",
    title: "Закат на набережной",
    description:
      "Спокойная встреча у воды: короткая прогулка вдоль Иртыша, музыка и разговоры до темноты.",
    image: "/images/embankment.webp",
    category: "entertainment",
    dateISO: atFuture(5, 18, 0),
    endTime: "20:00",
    placeId: "place-embankment",
    priceLabel: "Вход свободный",
    demo: true,
    savedBy: [],
  },
  {
    id: "event-market",
    title: "Городской маркет локальных брендов",
    description:
      "Городской маркет: небольшие локальные проекты, еда, керамика и вещи, которые хочется забрать домой. Формат на весь день, приходить можно в любое время.",
    image: "/images/market.webp",
    category: "food",
    dateISO: atFuture(8, 11, 0),
    endTime: "19:00",
    placeId: "place-republic-square",
    priceLabel: "Вход свободный",
    demo: true,
    savedBy: [],
  },
  {
    id: "event-theatre",
    title: "Премьера на сцене драмтеатра",
    description:
      "Театральный вечер в историческом здании. Перед покупкой билета проверьте репертуар и наличие мест.",
    image: "/images/theatre-stage.webp",
    category: "culture",
    dateISO: atFuture(11, 19, 0),
    endTime: "21:30",
    placeId: "place-theatre",
    priceLabel: "Билеты уточняются",
    demo: true,
    savedBy: [],
  },
  {
    id: "event-open-cinema",
    title: "Кино под открытым небом",
    description:
      "Летний формат в парке: большой экран, пледы и кино после заката. Место, фильм и погодные условия могут измениться.",
    image: "/images/cinema-hall.webp",
    category: "entertainment",
    dateISO: atFuture(14, 20, 0),
    endTime: "22:30",
    placeId: "place-kaisenov-park",
    priceLabel: "Вход свободный",
    demo: true,
    savedBy: [],
  },
  {
    id: "event-open-air-tour",
    title: "Экскурсия по музею под открытым небом",
    description:
      "Прогулка по деревянной архитектуре и музейным домам. Подходит для семей и тех, кто хочет увидеть город в деталях, а не только с набережной.",
    image: "/images/museum-open-air.webp",
    category: "culture",
    dateISO: atFuture(20, 12, 0),
    endTime: "13:30",
    placeId: "place-open-air-museum",
    priceLabel: "Условия уточняются",
    demo: true,
    savedBy: [],
  },
  {
    id: "event-run",
    title: "Утренняя пробежка по набережной",
    description:
      "Лёгкий городской забег для любого темпа: собираемся у набережной, бежим вдоль воды и заканчиваем разговором за кофе.",
    image: "/images/river.webp",
    category: "sport",
    dateISO: atFuture(23, 8, 0),
    endTime: "09:30",
    placeId: "place-embankment",
    priceLabel: "Вход свободный",
    demo: true,
    savedBy: [],
  },
];
