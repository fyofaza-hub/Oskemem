import type { CategoryId, Companion, Place } from "@/types";

type OsmPlacePoint = {
  osmId: string;
  name: string;
  coords: [number, number];
  address?: string;
};

type PlaceCopy = {
  description: string;
  shortDescription: string;
};

/**
 * Extra named points from OpenStreetMap within Oskemen and its nearby outskirts.
 * Coordinates and names are map data; the descriptions are deliberately general.
 * All reused photos are illustrative, not photos of the specific venue.
 * Data © OpenStreetMap contributors, ODbL 1.0.
 */
const copyByCategory: Record<CategoryId, PlaceCopy[]> = {
  food: [
    {
      description:
        "{name} — заведение в районе {district}. Меню, часы работы и доступность лучше уточнить перед визитом.",
      shortDescription: "Заведение в районе {district}.",
    },
    {
      description:
        "Городское место для еды или встречи: {name}, район {district}. Актуальное меню и условия посещения проверьте заранее.",
      shortDescription: "Еда и короткая пауза в районе {district}.",
    },
    {
      description:
        "{name} отмечено на карте в районе {district}. Если едете специально, уточните график работы и формат заведения.",
      shortDescription: "Место для встречи и перекуса в районе {district}.",
    },
  ],
  nature: [
    {
      description:
        "Природная точка {name} находится в районе {district}. Перед поездкой оцените погоду, маршрут и доступность места.",
      shortDescription: "Природа и прогулка в районе {district}.",
    },
    {
      description:
        "Место для прогулки {name} в районе {district}. Условия подхода и состояние территории лучше проверить на месте.",
      shortDescription: "Прогулка на свежем воздухе.",
    },
    {
      description:
        "{name} — природная точка на карте OpenStreetMap в районе {district}. Удобство подхода может зависеть от сезона и погоды.",
      shortDescription: "Природная точка рядом с {district}.",
    },
  ],
  entertainment: [
    {
      description:
        "Торговая точка {name} в районе {district}. Ассортимент, график работы и доступность уточняйте на месте.",
      shortDescription: "Рынок и городские покупки в районе {district}.",
    },
    {
      description:
        "{name} отмечено на карте OpenStreetMap в районе {district}. Перед визитом проверьте актуальный режим работы.",
      shortDescription: "Городская торговая площадка в районе {district}.",
    },
  ],
  culture: [
    {
      description:
        "Культурное или общественное место {name} в районе {district}. Программу и условия посещения стоит уточнить заранее.",
      shortDescription: "Культура и городская история в районе {district}.",
    },
    {
      description:
        "{name} — общественная площадка в районе {district}. Возможность посещения и актуальную программу проверьте перед визитом.",
      shortDescription: "Городское пространство для культуры и встреч.",
    },
  ],
  sport: [
    {
      description:
        "Спортивная площадка {name} находится в районе {district}. Расписание, аренду и условия доступа уточняйте у площадки.",
      shortDescription: "Спорт и активность в районе {district}.",
    },
    {
      description:
        "{name} — место для занятий спортом в районе {district}. Актуальные секции, расписание и правила посещения могут меняться.",
      shortDescription: "Место для активного отдыха в городе.",
    },
  ],
  landmark: [
    {
      description:
        "Точка интереса {name} отмечена на карте OpenStreetMap в районе {district}. Подробности и доступность проверяйте на месте.",
      shortDescription: "Городская достопримечательность в районе {district}.",
    },
    {
      description:
        "{name} — памятное или архитектурное место в районе {district}. Информация о доступе и возможных ограничениях может меняться.",
      shortDescription: "История и городская архитектура.",
    },
    {
      description:
        "Городской объект {name} находится в районе {district}. Это небольшая остановка, чтобы познакомиться с городской средой.",
      shortDescription: "Место интереса в районе {district}.",
    },
  ],
  leisure: [
    {
      description:
        "Общественное пространство {name} находится в районе {district}. Удобство доступа и состояние территории могут меняться.",
      shortDescription: "Прогулка и отдых в районе {district}.",
    },
    {
      description:
        "{name} — городское место для короткой прогулки в районе {district}. Перед посещением проверьте доступность территории.",
      shortDescription: "Пауза на свежем воздухе в городе.",
    },
  ],
};

const tagsByCategory: Record<CategoryId, string[]> = {
  food: ["еда", "встреча", "город"],
  nature: ["природа", "прогулка", "отдых"],
  entertainment: ["покупки", "рынок", "город"],
  culture: ["культура", "город", "история"],
  sport: ["спорт", "активность", "тренировка"],
  landmark: ["достопримечательность", "история", "город"],
  leisure: ["отдых", "прогулка", "город"],
};

const imagesByCategory: Record<CategoryId, string[]> = {
  food: ["/images/cafe-a.webp", "/images/cafe-b.webp", "/images/cafe-c.webp", "/images/food.webp", "/images/coffee-boom.webp"],
  nature: ["/images/nature.webp", "/images/park-path.webp", "/images/river.webp", "/images/panorama.webp", "/images/eco-park.webp"],
  entertainment: ["/images/market.webp", "/images/crowd.webp", "/images/books.webp"],
  culture: ["/images/arts-museum.webp", "/images/history-museum.webp", "/images/concert-hall.webp", "/images/books.webp"],
  sport: ["/images/gym.webp", "/images/tennis.webp", "/images/stadium.webp", "/images/athletics.webp", "/images/sports-palace.webp"],
  landmark: ["/images/panorama.webp", "/images/abai.webp", "/images/kirov.webp", "/images/church.webp", "/images/kazakhstan-sign.webp"],
  leisure: ["/images/embankment.webp", "/images/strelka.webp", "/images/river.webp", "/images/playground.webp"],
};

const priceByCategory: Record<CategoryId, Place["priceLevel"]> = {
  food: 1,
  nature: 0,
  entertainment: 1,
  culture: 1,
  sport: 2,
  landmark: 0,
  leisure: 0,
};

const companionsByCategory: Record<CategoryId, Companion[]> = {
  food: ["solo", "couple", "friends", "family"],
  nature: ["solo", "couple", "friends", "family"],
  entertainment: ["friends", "couple", "family"],
  culture: ["solo", "couple", "family"],
  sport: ["solo", "friends", "family"],
  landmark: ["solo", "couple", "friends", "family"],
  leisure: ["solo", "couple", "friends", "family"],
};

const mallCopy: PlaceCopy[] = [
  {
    description:
      "Торговый центр {name} в районе {district}: магазины, кафе и сервисы под одной крышей. Часы работы и список магазинов уточните перед визитом.",
    shortDescription: "Торговый центр в районе {district}.",
  },
  {
    description:
      "{name} — торговый центр в районе {district}. Здесь удобно совместить покупки, кофе и услуги; актуальный график уточняйте на месте.",
    shortDescription: "Шопинг и услуги в районе {district}.",
  },
  {
    description:
      "Гипермаркет {name} в районе {district}. Большая закупка одним заходом; часы работы и условия парковки уточните заранее.",
    shortDescription: "Гипермаркет в районе {district}.",
  },
];

function districtFor([lat, lon]: [number, number]) {
  if (lat < 49.92 || lon > 82.67 || lon < 82.55) return "Окрестности Өскемена";
  if (lat < 49.94) return "Левый берег";
  if (lat >= 49.96 && lon < 82.62) return "Студгородок";
  if (lon < 82.59) return "Октябрьский";
  if (lon > 82.64) return "Шмелёв Лог";
  return "Стрелка";
}

function createPlaces(category: CategoryId, points: OsmPlacePoint[], templates?: PlaceCopy[]): Place[] {
  return points.map((point, index) => {
    const district = districtFor(point.coords);
    const templateList = templates ?? copyByCategory[category];
    const copy = templateList[index % templateList.length];
    return {
      id: `place-osm-${point.osmId}`,
      name: point.name,
      category,
      district,
      address: point.address || district,
      description: copy.description,
      shortDescription: copy.shortDescription,
      descriptionTemplate: copy.description,
      shortDescriptionTemplate: copy.shortDescription,
      coords: point.coords,
      image: imagesByCategory[category][index % imagesByCategory[category].length],
      tags: tagsByCategory[category],
      priceLevel: priceByCategory[category],
      companions: companionsByCategory[category],
      source: "OpenStreetMap",
      photoCredit: "иллюстративное фото",
      illustrativePhoto: true,
    };
  });
}

const naturePoints: OsmPlacePoint[] = [
  { osmId: "559845426", name: "гора Священническая", coords: [49.9042906, 82.689004], address: "улица Больничная, 30" },
  { osmId: "1848835210", name: "Наскальные рисунки", coords: [49.9050063, 82.5891234] },
  { osmId: "2855696614", name: "Гора Великой Надежды", coords: [49.9259701, 82.6842576] },
  { osmId: "2856109390", name: "Сопка Курган", coords: [49.9024965, 82.6863417] },
  { osmId: "282524452", name: "Гряда Светлый Путь", coords: [49.9150741, 82.6964359] },
  { osmId: "282730789", name: "Скала Ковчег", coords: [49.9196339, 82.6869901] },
  { osmId: "282731305", name: "Скала Звериная", coords: [49.9189567, 82.688362] },
  { osmId: "282741291", name: "Скала Рождество", coords: [49.9187966, 82.6981899] },
  { osmId: "16079491", name: "Скалы Малые Печи (Три Пирамиды)", coords: [49.9208272, 82.6934129] },
];

const landmarkPoints: OsmPlacePoint[] = [
  { osmId: "566566415", name: "Молельная комната Веры, Надежды, Любви и матери их Софии", coords: [49.9298922, 82.6772857] },
  { osmId: "571915794", name: "Мемориал бывшим японским военнопленным", coords: [49.9088319, 82.6888177] },
  { osmId: "878238752", name: "Памятник Я. В. Ушанову", coords: [49.9591858, 82.6056247], address: "улица Потанина, 13/1 · рядом" },
  { osmId: "903724964", name: "Мемориальный комплекс участникам ВОВ", coords: [49.9484829, 82.5868961] },
  { osmId: "1660610498", name: "Памяти погибших в Афганской войне", coords: [49.9432452, 82.6083622] },
  { osmId: "2327454144", name: "Свято-Никольский тюремный храм", coords: [49.9538253, 82.6645121], address: "улица Милицейская, 21/1" },
  { osmId: "2993796301", name: "Памятник О. Бокею", coords: [49.901527, 82.6138844], address: "улица Утепова, 29 · рядом" },
  { osmId: "3212991865", name: "Памятник Славскому", coords: [49.9448408, 82.6031182], address: "набережная имени Е. П. Славского, 32 · рядом" },
  { osmId: "3580398884", name: "Бюст А. К. Протозанова", coords: [49.9553282, 82.6226327] },
  { osmId: "3634244556", name: "Памятник Кайсенову", coords: [49.9474705, 82.6186882], address: "улица Антона Чехова, 31 · рядом" },
  { osmId: "3634245253", name: "Статуя Б. Александрова", coords: [49.9567616, 82.6153433] },
  { osmId: "3634245261", name: "Памятник Мусе Джалилю", coords: [49.9521349, 82.6105363] },
  { osmId: "3639120487", name: "Памятник борцам за советскую власть", coords: [49.9418407, 82.6234755] },
  { osmId: "4003023288", name: "Скульптура «Женщина с ребёнком»", coords: [49.9688834, 82.6003126], address: "проспект Шакарима, 149/2 · рядом" },
  { osmId: "4104929889", name: "Церковь евангельских христиан-баптистов «Родник»", coords: [49.9548954, 82.6301096], address: "улица Казахстан, 81/1" },
  { osmId: "4181155102", name: "Памятник Кабанбай батыру", coords: [49.9577573, 82.5037658] },
  { osmId: "5251301085", name: "Скульптура «Замок»", coords: [49.9444286, 82.6055778] },
  { osmId: "8447939657", name: "Декоративная скульптура «Любовь»", coords: [49.9616691, 82.6031982], address: "проспект Нурсултана Назарбаева, 28" },
  { osmId: "11940332667", name: "Монумент работникам УМЗ и В. П. Потанину", coords: [49.9571354, 82.5947403] },
  { osmId: "13316137565", name: "Памятник Александру Пушкину", coords: [49.9558743, 82.6348099], address: "улица Казахстан, 104 · рядом" },
  { osmId: "296937274", name: "Большой выставочный павильон", coords: [49.9321779, 82.6161756] },
  { osmId: "296937275", name: "Малый выставочный павильон", coords: [49.9324213, 82.6170642] },
  { osmId: "296937276", name: "Павильон 109 героев — восточноказахстанцев", coords: [49.9340794, 82.6167787] },
  { osmId: "296937278", name: "Город мастеров", coords: [49.9322642, 82.608874] },
  { osmId: "296943596", name: "Выставка авиационной техники", coords: [49.9323084, 82.6186206] },
  { osmId: "296994918", name: "Беседка влюблённых", coords: [49.9327257, 82.6039144] },
  { osmId: "296996107", name: "Дворец раджи", coords: [49.9333757, 82.6027908] },
  { osmId: "296996143", name: "Дворец китайского императора", coords: [49.9329768, 82.6004432] },
  { osmId: "296996268", name: "Лабиринт", coords: [49.9349124, 82.5996535] },
  { osmId: "296996548", name: "Корабль", coords: [49.9348753, 82.6013703] },
  { osmId: "296996699", name: "Лодочная станция", coords: [49.9353541, 82.6035147] },
  { osmId: "296998433", name: "Водопады", coords: [49.9358117, 82.6017082] },
  { osmId: "297007138", name: "Сад в исламском стиле", coords: [49.9333308, 82.6150521] },
  { osmId: "297010918", name: "Этнографический комплекс", coords: [49.9345694, 82.6099375] },
  { osmId: "297137340", name: "Артиллерийская аллея", coords: [49.9330002, 82.6158986] },
  { osmId: "1328915094", name: "Инсталляция «Государственные символы»", coords: [49.9387325, 82.6780975] },
];

const sportPoints: OsmPlacePoint[] = [
  { osmId: "2247053805", name: "Бильярдный клуб «Империя»", coords: [49.9570939, 82.6296222], address: "улица Александра Протозанова, 17" },
  { osmId: "2313313299", name: "Федерация спортивного ориентирования", coords: [49.964691, 82.6272621], address: "проспект Шакарима, 11" },
  { osmId: "3126598178", name: "Спортивный центр «Жемчужинка»", coords: [49.9698416, 82.5940458], address: "проспект Нурсултана Назарбаева, 54" },
  { osmId: "3634245238", name: "Спортивный центр «Олимпия»", coords: [49.9552888, 82.5962977], address: "улица Амре Кашаубаев, 32А" },
  { osmId: "44503367", name: "Спортивная площадка «Алтай»", coords: [49.9519762, 82.626931] },
  { osmId: "69354168", name: "Спортивный комплекс Prima-Zodiak", coords: [49.9058766, 82.6318675], address: "проспект Каныша Сатпаева, 27/1" },
  { osmId: "74467259", name: "Малая арена «Восток»", coords: [49.9712048, 82.58646] },
  { osmId: "91835071", name: "Спортивный комплекс «Модуль»", coords: [49.9567139, 82.5868765], address: "улица Серикбаева, 37/2" },
  { osmId: "1074145785", name: "Школа настольного тенниса", coords: [49.9191417, 82.620599], address: "проспект Каныша Сатпаева, 82/8" },
];

const culturePoints: OsmPlacePoint[] = [
  { osmId: "3925419377", name: "Библиотека № 10", coords: [49.9342341, 82.5826154], address: "улица Горького, 11А" },
  { osmId: "7003979751", name: "Центральная городская библиотека", coords: [49.9432856, 82.6108065], address: "набережная имени Е. П. Славского, 22 · рядом" },
  { osmId: "7003979777", name: "Дворец творчества школьников", coords: [49.9529975, 82.6234961], address: "улица Антона Чехова, 63 · рядом" },
  { osmId: "44763045", name: "Дом Дружбы", coords: [49.9740799, 82.5902093], address: "проспект Нурсултана Назарбаева, 68" },
  { osmId: "47857377", name: "Детско-юношеская библиотека имени Гайдара", coords: [49.9599700, 82.6103555], address: "улица Космическая, 6/2" },
  { osmId: "47857474", name: "Областная научно-техническая библиотека", coords: [49.9648794, 82.6143034], address: "проспект Абая, 19" },
  { osmId: "296940061", name: "Открытая сцена", coords: [49.9320211, 82.6138698] },
];

const leisurePoints: OsmPlacePoint[] = [
  { osmId: "1521101520", name: "Поющий фонтан", coords: [49.9475784, 82.6300096] },
  { osmId: "139429261", name: "Парк у бывшей реки Комендантки", coords: [49.9606297, 82.5934533], address: "улица 30-й гвардейской дивизии, 24/1 · рядом" },
];

const marketPoints: OsmPlacePoint[] = [
  { osmId: "1793099985", name: "Рынок на улице Казахстан", coords: [49.9481349, 82.6119278], address: "проспект Ауэзова, 11А · рядом" },
  { osmId: "1938072316", name: "Рынок «На Ворошилова»", coords: [49.9731561, 82.5959473], address: "проспект Шакарима" },
  { osmId: "10593365611", name: "Муниципальный рынок «Жәрдем»", coords: [49.9528653, 82.6323419], address: "улица Казахстан, 76" },
  { osmId: "10593500305", name: "Рынок «Ровесник»", coords: [49.9582932, 82.5844909], address: "улица Серикбаева, 27" },
  { osmId: "41951962", name: "Центральный рынок", coords: [49.9525702, 82.6339727], address: "улица Кабанбай батыра, 142/4" },
  { osmId: "89399476", name: "Рынок «Дос-Нар»", coords: [49.9651897, 82.5870032], address: "улица Виноградова, 17А" },
];

const mallPoints: OsmPlacePoint[] = [
  { osmId: "44632765", name: "ТРЦ «ADK»", coords: [49.9850592, 82.5925496], address: "улица Бажова, 110" },
  { osmId: "748958171", name: "ТЦ «ADK river»", coords: [49.942987, 82.6257357] },
  { osmId: "47856541", name: "ЦУМ", coords: [49.9503769, 82.6176094], address: "улица Максима Горького, 71" },
  { osmId: "47859173", name: "ТЦ «Нарын»", coords: [49.9508137, 82.6184559], address: "улица Максима Горького, 74" },
  { osmId: "47859193", name: "ТЦ «Сауле»", coords: [49.9498366, 82.6216361], address: "улица Максима Горького, 62" },
  { osmId: "47859293", name: "ТЦ «Пассаж»", coords: [49.9536304, 82.6316949] },
  { osmId: "47859321", name: "ТЦ «Евразия»", coords: [49.9514709, 82.6350089], address: "улица Кабанбай батыра, 140" },
  { osmId: "47859275", name: "ТЦ «Зангар»", coords: [49.9517767, 82.6340937], address: "улица Кабанбай батыра, 144" },
  { osmId: "10574187431", name: "ТЦ «Ануара»", coords: [49.9520374, 82.6331306], address: "улица Кабанбай батыра, 146/1" },
  { osmId: "47859522", name: "ТЦ «Мерей»", coords: [49.9460955, 82.6491413], address: "улица Кабанбай батыра, 76" },
  { osmId: "47859482", name: "ТЦ «Альшемали»", coords: [49.9614007, 82.6339768] },
  { osmId: "7004013612", name: "ТЦ «Император»", coords: [49.9509403, 82.6165223] },
  { osmId: "2440065987", name: "ТЦ «Саянур»", coords: [49.9489055, 82.6392648] },
  { osmId: "1150941033", name: "ТД «Коктем»", coords: [49.9652317, 82.5989485] },
  { osmId: "237688250", name: "ТЦ «Океан»", coords: [49.8984533, 82.6132439], address: "Утепова улица, 25/2" },
  { osmId: "396693279", name: "ТРЦ «Тамирлан»", coords: [49.9584414, 82.6136777], address: "проспект Абая, 1/4" },
  { osmId: "47858105", name: "ТЦ «Адем»", coords: [49.9801663, 82.5808448], address: "проспект Нурсултана Назарбаева, 86/3" },
  { osmId: "262385723", name: "ТЦ «Музтау»", coords: [49.9497341, 82.6170767], address: "улица Тохтарова, 56/4" },
  { osmId: "2317689129", name: "ТД «Элегант»", coords: [49.9732119, 82.5899605], address: "проспект Нурсултана Назарбаева, 66" },
  { osmId: "9969233956", name: "Универсам № 3", coords: [49.947594, 82.6491152], address: "улица Льва Толстого, 8" },
  { osmId: "179259211", name: "Гипермаркет Metro", coords: [49.9155737, 82.6244105], address: "проспект Каныша Сатпаева, 76/2" },
  { osmId: "10804017143", name: "Гипермаркет Magnum", coords: [49.9496649, 82.6177776] },
  { osmId: "829667942", name: "Оптомаркет «Магнум»", coords: [49.9294993, 82.6126964] },
  { osmId: "359153717", name: "Fresh Market", coords: [49.9225102, 82.6213082], address: "проспект Каныша Сатпаева, 84" },
  { osmId: "645164650", name: "Гастроном «Волна»", coords: [49.9497931, 82.6402272], address: "улица Бурова, 7" },
  { osmId: "2457054963", name: "Супермаркет «Гульдер»", coords: [49.8997953, 82.6154172] },
  { osmId: "1474885501", name: "Супермаркет «Достык»", coords: [49.9001311, 82.6164057] },
  { osmId: "47857477", name: "Магазин «Горизонт»", coords: [49.9649746, 82.613007], address: "улица Михаэлиса, 4" },
  { osmId: "68868415", name: "Супермаркет «Даниэль»", coords: [49.9569211, 82.6138896], address: "проспект Абая, 1/1" },
  { osmId: "11809885187", name: "Family Market", coords: [49.9236022, 82.6294027] },
];

const foodPoints: OsmPlacePoint[] = [
  { osmId: "636880556", name: "Кафе «Чибис»", coords: [49.9261349, 82.5760233], address: "улица Логвина, 1/1" },
  { osmId: "636880560", name: "Кафе «Береке»", coords: [49.9293368, 82.6089215], address: "улица Жибек Жолы, 1 к2" },
  { osmId: "838567873", name: "Кафе «Восток»", coords: [49.9758864, 82.5820511], address: "улица Добролюбова, 42" },
  { osmId: "878209814", name: "Кафе «Пицца-Блюз»", coords: [49.9555867, 82.6139051], address: "улица Астана, 4 · рядом" },
  { osmId: "878219227", name: "Паб «Тайм-аут»", coords: [49.9558055, 82.6137631], address: "проспект Нурсултана Назарбаева, 1" },
  { osmId: "1474885505", name: "Где? Где? Pub", coords: [49.9036572, 82.6131427], address: "улица Жастар, 15/2" },
  { osmId: "1478660596", name: "Pizza Blues", coords: [49.9440924, 82.6260759], address: "улица Казахстан, 64 · рядом" },
  { osmId: "1478660597", name: "Паб Oxota", coords: [49.9449982, 82.6247873], address: "улица Кайсенова, 45" },
  { osmId: "1488051504", name: "Кафе «Чехов»", coords: [49.9496027, 82.6251791], address: "улица Сагадата Нурмагамбетова, 25" },
  { osmId: "1647873682", name: "Спорт-бар «Оле»", coords: [49.9428759, 82.6185029], address: "набережная имени Е. П. Славского, 14" },
  { osmId: "1670423720", name: "Паб «Техас»", coords: [49.9568701, 82.6052573], address: "улица Амре Кашаубаев, 5" },
  { osmId: "1670423726", name: "Паб «Встреча»", coords: [49.9569977, 82.6047102], address: "улица Амре Кашаубаев, 6" },
  { osmId: "2271818487", name: "Кафе «Бона»", coords: [49.9707302, 82.6206267], address: "улица Лермонтова, 50/1" },
  { osmId: "2271818511", name: "Ресторан «Нуржау»", coords: [49.9671912, 82.6183681], address: "проспект Абая, 20/1 · рядом" },
  { osmId: "2433021466", name: "Столовая «Асхана»", coords: [49.9776496, 82.6061773], address: "Новорабочая улица, 4" },
  { osmId: "2440066038", name: "Кафе «Арлекино»", coords: [49.9467145, 82.6474615], address: "улица Кабанбай батыра, 80 · рядом" },
  { osmId: "3634245220", name: "Кафе «Клеопатра»", coords: [49.9462700, 82.6034153], address: "улица Лихарева, 7" },
  { osmId: "3639011748", name: "Паб Sandy", coords: [49.9506694, 82.6062633], address: "улица Александра Протозанова, 93" },
  { osmId: "3670176841", name: "Lounge Bar «Вояж»", coords: [49.9585838, 82.6052515], address: "улица Потанина, 13" },
  { osmId: "3946380892", name: "Кафе Istanbul", coords: [49.9626504, 82.5826144], address: "улица Виноградова, 9" },
  { osmId: "3995066961", name: "Кафе «Донер»", coords: [49.9506332, 82.6217075], address: "улица Антона Чехова, 49" },
  { osmId: "4101268978", name: "Бар Garden Room", coords: [49.9617844, 82.5959068], address: "улица 30-й гвардейской дивизии, 20/1" },
  { osmId: "4623919105", name: "Некафе", coords: [49.9662853, 82.5982064], address: "улица Алматинская, 72 · рядом" },
  { osmId: "5237442021", name: "Этнокафе «Алаш»", coords: [49.9649032, 82.5849686], address: "улица Виноградова, 17 · рядом" },
  { osmId: "6636634596", name: "Ресторан «Две реки»", coords: [49.9469974, 82.5914135], address: "набережная имени Е. П. Славского, 60/2" },
  { osmId: "6690633266", name: "Кафе-мороженое «33 пингвина»", coords: [49.9418610, 82.627732], address: "улица Пермитина, 11/1" },
  { osmId: "7670738821", name: "KFC", coords: [49.9489470, 82.617665], address: "проспект Победы, 4/1" },
  { osmId: "9942864284", name: "Ресторан-гриль Koster", coords: [49.9536740, 82.5987715], address: "улица Астана, 34 · рядом" },
  { osmId: "9942864285", name: "Ресторан Oblaka Lounge", coords: [49.9536636, 82.5986078], address: "улица Астана, 34" },
];

export const additionalPlaces: Place[] = [
  ...createPlaces("nature", naturePoints),
  ...createPlaces("landmark", landmarkPoints),
  ...createPlaces("sport", sportPoints),
  ...createPlaces("culture", culturePoints),
  ...createPlaces("leisure", leisurePoints),
  ...createPlaces("entertainment", marketPoints),
  ...createPlaces("food", foodPoints),
  ...createPlaces("entertainment", mallPoints, mallCopy),
];
