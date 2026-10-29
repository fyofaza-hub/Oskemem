import type { Category, CategoryId, Place } from "@/types";
import { tr } from "@/i18n/runtime";

export const categories: Category[] = [
  {
    id: "food",
    label: tr("Кафе и рестораны"),
    shortLabel: tr("Кафе"),
    description: tr("Завтраки, кофе, ужины и места, где хочется задержаться"),
    accent: "#F1B36B",
  },
  {
    id: "nature",
    label: tr("Природа"),
    shortLabel: tr("Природа"),
    description: tr("Парки, набережные и зелёные паузы в городе"),
    accent: "#76C9A1",
  },
  {
    id: "entertainment",
    label: tr("Развлечения"),
    shortLabel: tr("Досуг"),
    description: tr("Кино, концерты и поводы выйти из дома"),
    accent: "#B49CFF",
  },
  {
    id: "culture",
    label: tr("Культура"),
    shortLabel: tr("Культура"),
    description: tr("Музеи, театры и городские истории"),
    accent: "#4D8DFF",
  },
  {
    id: "sport",
    label: tr("Спорт"),
    shortLabel: tr("Спорт"),
    description: tr("Лёд, трибуны и активные выходные"),
    accent: "#69D0E8",
  },
  {
    id: "landmark",
    label: tr("Достопримечательности"),
    shortLabel: tr("Места"),
    description: tr("Городские символы и точки с историей"),
    accent: "#E8D7A9",
  },
  {
    id: "leisure",
    label: tr("Отдых"),
    shortLabel: tr("Отдых"),
    description: tr("Прогулки, закаты и неспешные вечера"),
    accent: "#F28C9C",
  },
];

export const categoryMap = Object.fromEntries(
  categories.map((category) => [category.id, category]),
) as Record<Category["id"], Category>;

export const countPlacesByCategory = (places: Place[]) => {
  const result = { all: places.length } as Record<CategoryId | "all", number>;
  categories.forEach((category) => {
    result[category.id] = 0;
  });
  places.forEach((place) => {
    result[place.category] += 1;
  });
  return result;
};

export const companionOptions = [
  { id: "solo", label: tr("Один") },
  { id: "couple", label: tr("Вдвоём") },
  { id: "friends", label: tr("С друзьями") },
  { id: "family", label: tr("С семьёй") },
] as const;

export const budgetOptions = [
  {
    id: "free",
    label: tr("Бесплатно"),
    hint: tr("Только места без входного билета"),
  },
  {
    id: "moderate",
    label: tr("Умеренно"),
    hint: tr("Кафе и музеи в спокойном бюджете"),
  },
  {
    id: "any",
    label: tr("Без ограничений"),
    hint: tr("Покажем всё, что подходит по интересам"),
  },
] as const;
