import type { CategoryId, Companion, Place } from "@/types";
import { categories } from "@/data/categories";
import { normalize } from "@/lib/utils";

/** Признак, объясняющий пользователю, почему место попало в подборку. */
export type VoiceMatchReason = "query" | "category" | "interest" | "companion" | "budget";

export interface VoiceMatch {
  place: Place;
  score: number;
  reasons: VoiceMatchReason[];
}

export interface VoiceMatchResult {
  /** Нормализованный запрос, использованный для подбора. */
  query: string;
  /** Лучшее совпадение или null, если мест совсем нет. */
  best: VoiceMatch | null;
  /** Дополнительные варианты после лучшего. */
  alternatives: VoiceMatch[];
  /** true — прямых совпадений с запросом не нашлось, подбор сделан по интересам. */
  fallback: boolean;
}

/** Ключевые слова категорий: подстроки для normalize() нижнего регистра. ru + en. */
const CATEGORY_KEYWORDS: Record<CategoryId, string[]> = {
  food: [
    "кафе", "кофе", "кофейн", "ресторан", "поесть", "перекус", "завтрак", "обед", "ужин",
    "еда", "вкусн", "десерт", "сладк", "пицц", "стейк", "банкет", "напиток", "шакк",
    "food", "coffee", "cafe", "restaurant", "eat", "dinner", "drink",
  ],
  nature: [
    "природ", "парк", "сквер", "лес", "набережн", "рек", "иртыш", "озеро", "зелён", "зелен",
    "green", "park", "nature", "river", "outdoor",
  ],
  entertainment: [
    "развлеч", "кино", "боулинг", "концерт", "бильярд", "квиз", "квест", "игров", "играть",
    "весел", "весель", "дискотек", "вечеринк", "событие", "афиш",
    "party", "cinema", "movie", "fun", "entertainment", "bowling", "concert", "games",
  ],
  culture: [
    "культур", "музей", "театр", "выставк", "истор", "экспозиц", "галере", "филармони",
    "орган", "библиотек", "книг", "картин",
    "culture", "museum", "theatre", "theater", "history", "art", "gallery",
  ],
  sport: [
    "спорт", "футбол", "бассейн", "гимнастик", "лёд", "лед", "каток", "коньк", "стадион",
    "бег", "тренаж", "качал", "атлетик",
    "sport", "gym", "skate", "run", "fitness", "workout", "stadium",
  ],
  landmark: [
    "достопримеч", "памятник", "символ", "герб", "стел", "краеведч", "казахстан",
    "landmark", "monument", "sightseeing",
  ],
  leisure: [
    "отдох", "отдых", "прогул", "закат", "вечер", "спокойн", "расслаб", "уют", "тих",
    "walk", "leisure", "relax", "evening", "sunset", "chill", "quiet",
  ],
};

const CATEGORY_INTENT_WEIGHT = 10;
const CATEGORY_MISS_PENALTY = 3;

/** Подсказки о компании из запроса. */
const COMPANION_KEYWORDS: Array<[Companion, string[]]> = [
  ["family", ["семь", "семей", "дет", "ребён", "ребен", "доч", "сын", "kids", "family", "children"]],
  ["friends", ["друз", "друж", "компан", "тусов", "ребята", "friends", "company"]],
  ["couple", ["вдвоём", "вдвоем", "свидан", "двое", "романт", "couple", "date", "romantic"]],
  ["solo", ["один", "одна", "сам", "соло", "alone", "solo"]],
];

const FREE_KEYWORDS = ["бесплатн", "без денег", "бесплатно", "free"];
const CHEAP_KEYWORDS = ["недорог", "дешев", "cheap"];

const COMPANION_WEIGHT = 4;
const FREE_BONUS = 5;
const CHEAP_BONUS = 3;
const FREE_MISS_PENALTY = 2;
const INTEREST_BONUS = 4;
const FEATURED_BONUS = 0.5;

/** Служебные слова запроса, которые не участвуют в поиске по тексту. */
const STOP_WORDS = new Set([
  "найди", "найти", "поищи", "покажи", "подбери", "хочу", "хочется", "мне", "куда", "где",
  "сходить", "сход", "пойти", "идти", "место", "места", "точку", "пожалуйста", "сейчас",
  "сегодня", "вечером", "днем", "днём", "городе", "город", "хорошее", "интересное", "какое",
  "какой", "что", "бы", "этом", "для", "под", "плиз", "please", "find", "show", "want",
  "need", "look", "give", "some", "place", "city", "looking", "looking", "the", "and",
  "for", "with", "near", "something", "anything", "you", "can", "would", "like",
]);

export interface VoiceIntents {
  category: CategoryId | null;
  companion: Companion | null;
  free: boolean;
  cheap: boolean;
}

/** Достаёт из разговорного запроса категорию, компанию и бюджет. */
export const detectIntents = (transcript: string): VoiceIntents => {
  const text = normalize(transcript);

  let category: CategoryId | null = null;
  let bestHits = 0;
  for (const item of categories) {
    const hits = CATEGORY_KEYWORDS[item.id].filter((keyword) => text.includes(keyword)).length;
    if (hits > bestHits) {
      bestHits = hits;
      category = item.id;
    }
  }

  let companion: Companion | null = null;
  for (const [id, keywords] of COMPANION_KEYWORDS) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      companion = id;
      break;
    }
  }

  return {
    category,
    companion,
    free: FREE_KEYWORDS.some((keyword) => text.includes(keyword)),
    cheap: CHEAP_KEYWORDS.some((keyword) => text.includes(keyword)),
  };
};

/** Токены запроса без служебных слов — для поиска по названию, тегам и району. */
const queryTokens = (transcript: string): string[] =>
  Array.from(
    new Set(
      normalize(transcript)
        .split(/[^\p{L}\p{N}]+/u)
        .filter((token) => token.length >= 3 && !STOP_WORDS.has(token)),
    ),
  );

/**
 * Подбирает место под заданный пользователем запрос.
 * Помимо совпадений с самим запросом бонус получают места,
 * совпадающие с интересами профиля (currentUser.interests).
 */
export const matchPlaces = (
  transcript: string,
  places: Place[],
  interests: CategoryId[] = [],
): VoiceMatchResult => {
  const query = normalize(transcript);
  const intents = detectIntents(query);
  const tokens = queryTokens(query);
  const fallback = !intents.category && !tokens.length && !intents.companion && !intents.free && !intents.cheap;

  const scored = places
    .map<VoiceMatch>((place) => {
      const name = normalize(place.name);
      const tags = place.tags.map(normalize);
      const district = normalize(place.district);
      const shortDescription = normalize(place.shortDescription);
      const description = normalize(place.description);
      const reasons: VoiceMatchReason[] = [];
      let score = 0;

      if (intents.category) {
        if (place.category === intents.category) {
          score += CATEGORY_INTENT_WEIGHT;
          reasons.push("category");
        } else {
          score -= CATEGORY_MISS_PENALTY;
        }
      }

      if (intents.companion) {
        if (place.companions.includes(intents.companion)) {
          score += COMPANION_WEIGHT;
          reasons.push("companion");
        } else {
          score -= COMPANION_WEIGHT / 2;
        }
      }

      if (intents.free) {
        if (place.priceLevel === 0) {
          score += FREE_BONUS;
          reasons.push("budget");
        } else {
          score -= FREE_MISS_PENALTY;
        }
      }

      if (intents.cheap) {
        if (place.priceLevel <= 1) {
          score += CHEAP_BONUS;
          reasons.push("budget");
        } else {
          score -= 1;
        }
      }

      for (const token of tokens) {
        if (name.includes(token)) {
          score += 6;
          reasons.push("query");
        } else if (tags.some((tag) => tag.includes(token))) {
          score += 5;
          reasons.push("query");
        } else if (district.includes(token)) {
          score += 3;
          reasons.push("query");
        } else if (shortDescription.includes(token) || description.includes(token)) {
          score += 1;
          reasons.push("query");
        }
      }

      if (interests.includes(place.category)) {
        score += INTEREST_BONUS;
        reasons.push("interest");
      }

      if (place.featured) score += FEATURED_BONUS;

      return { place, score, reasons: Array.from(new Set(reasons)) };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (Boolean(b.place.featured) !== Boolean(a.place.featured)) {
        return Number(Boolean(b.place.featured)) - Number(Boolean(a.place.featured));
      }
      return a.place.name.localeCompare(b.place.name, "ru");
    });

  const positives = scored.filter((match) => match.score > 0);
  if (positives.length) {
    return { query, best: positives[0], alternatives: positives.slice(1, 4), fallback: false };
  }

  // Ничего точного не нашлось — подбираем по интересам профиля.
  const ranked = [...scored].sort((a, b) => {
    if (Boolean(b.place.featured) !== Boolean(a.place.featured)) {
      return Number(Boolean(b.place.featured)) - Number(Boolean(a.place.featured));
    }
    return a.place.name.localeCompare(b.place.name, "ru");
  });
  const best = ranked[0] ?? null;
  return {
    query,
    best: best ? { ...best, reasons: Array.from(new Set(["interest", ...best.reasons])) } : null,
    alternatives: ranked.slice(1, 4),
    fallback: true,
  };
};
