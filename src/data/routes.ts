import type { Route } from "@/types";

const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

/**
 * Готовые маршруты-примеры. Время, расстояния и порядок точек демонстрационные.
 */
export const seedRoutes: Route[] = [
  {
    id: "route-saturday",
    title: "Суббота в Усть-Каменогорске",
    description:
      "Медленный день без спешки: вода, музей, кофе и парк. Маршрут начинается на набережной, а заканчивается длинным ужином в центре.",
    authorId: "u-alina",
    cover: "/images/embankment.webp",
    categories: ["leisure", "culture", "food", "nature"],
    stops: [
      { placeId: "place-embankment", time: "14:00", note: "Прогулка вдоль Иртыша" },
      { placeId: "place-history-museum", time: "15:15", note: "История города" },
      { placeId: "place-zebra", time: "16:30", note: "Кофейная пауза" },
      { placeId: "place-jambyl-park", time: "17:30", note: "Тихая аллея" },
      { placeId: "place-qurt-wine", time: "19:00", note: "Ужин" },
    ],
    durationMin: 300,
    distanceKm: 3.4,
    isPublic: true,
    demo: true,
    savedBy: [],
    createdAt: daysAgo(4),
  },
  {
    id: "route-culture",
    title: "Культурная Стрелка",
    description:
      "Четыре остановки в историческом центре: живопись, археология, деревянное зодчество и поздний обед. Почти весь маршрут можно пройти пешком.",
    authorId: "u-maria",
    cover: "/images/theatre.webp",
    categories: ["culture", "food"],
    stops: [
      { placeId: "place-arts-museum", time: "11:00", note: "Постоянная экспозиция" },
      { placeId: "place-history-museum", time: "12:30", note: "Краеведение" },
      { placeId: "place-open-air-museum", time: "14:00", note: "Архитектура под открытым небом" },
      { placeId: "place-qurt-wine", time: "15:30", note: "Обед" },
    ],
    durationMin: 300,
    distanceKm: 2.1,
    isPublic: true,
    demo: true,
    savedBy: [],
    createdAt: daysAgo(8),
  },
  {
    id: "route-morning",
    title: "Утро в парке",
    description:
      "Короткий маршрут для выходного утра: два парка, тишина и кофе в конце. Хорошо работает, если хочется выйти из дома, но не хочется плана на весь день.",
    authorId: "u-erzhan",
    cover: "/images/jambyl-park.webp",
    categories: ["nature", "food"],
    stops: [
      { placeId: "place-jambyl-park", time: "09:00", note: "Первая прогулка" },
      { placeId: "place-kaisenov-park", time: "10:30", note: "Исторические аллеи" },
      { placeId: "place-zebra", time: "12:00", note: "Кофе" },
    ],
    durationMin: 180,
    distanceKm: 2.7,
    isPublic: true,
    demo: true,
    savedBy: [],
    createdAt: daysAgo(11),
  },
  {
    id: "route-evening-light",
    title: "Вечерний свет",
    description:
      "Маршрут на закат: начать у площади, выйти к воде и закончить ужином. Сохраните его на вечер, когда не хочется ничего решать.",
    authorId: "u-aidos",
    cover: "/images/embankment.webp",
    categories: ["leisure", "landmark", "food"],
    stops: [
      { placeId: "place-republic-square", time: "18:30", note: "Встреча у фонтана" },
      { placeId: "place-embankment", time: "19:15", note: "Закат у Иртыша" },
      { placeId: "place-barbq", time: "20:30", note: "Ужин" },
    ],
    durationMin: 180,
    distanceKm: 1.9,
    isPublic: true,
    demo: true,
    savedBy: [],
    createdAt: daysAgo(15),
  },
  {
    id: "route-contrasts",
    title: "Контрасты Өскемена",
    description:
      "Один день — разные города: мечеть и арена, собор и пиццерия. Маршрут для гостей, которые хотят увидеть не только открыточный центр.",
    authorId: "u-daniyar",
    cover: "/images/church.webp",
    categories: ["landmark", "sport", "food"],
    stops: [
      { placeId: "place-mosque", time: "10:00", note: "Утренний визит" },
      { placeId: "place-sports-palace", time: "11:30", note: "Городской спорт" },
      { placeId: "place-cathedral", time: "13:00", note: "Старый город" },
      { placeId: "place-pizza-blues", time: "14:30", note: "Обед" },
    ],
    durationMin: 360,
    distanceKm: 7.4,
    isPublic: true,
    demo: true,
    savedBy: [],
    createdAt: daysAgo(21),
  },
];
