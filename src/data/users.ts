import type { CategoryId, User } from "@/types";

export const seedUsers: User[] = [
  {
    id: "u-alina",
    name: "Алина Смагулова",
    username: "alina.oskemen",
    email: "demo@oskemen.kz",
    bio: "Ищу свет, кофе и нетуристические улицы. Собираю маршруты по левому берегу и делюсь тем, что нашла.",
    city: "Өскемен",
    joinedAt: "2025-04-12",
    avatarColor: "linear-gradient(135deg, #4D8DFF 0%, #1C4CA8 100%)",
    interests: ["culture", "leisure", "food"],
    demo: true,
    role: "admin",
  },
  {
    id: "u-erzhan",
    name: "Ержан Ким",
    username: "erzhan.kim",
    email: "erzhan@oskemen.kz",
    bio: "Фотограф. Люблю утренние парки, длинные прогулки вдоль Иртыша и фасады, которые никто не замечает.",
    city: "Өскемен",
    joinedAt: "2025-02-03",
    avatarColor: "linear-gradient(135deg, #6BB7A0 0%, #1E5147 100%)",
    interests: ["nature", "culture", "landmark"],
    demo: true,
  },
  {
    id: "u-maria",
    name: "Мария Ли",
    username: "maria.li",
    email: "maria@oskemen.kz",
    bio: "Кураторка локальных проектов. Коллекционирую тихие культурные места и разговоры после выставок.",
    city: "Өскемен",
    joinedAt: "2025-06-18",
    avatarColor: "linear-gradient(135deg, #B49CFF 0%, #4E3A8E 100%)",
    interests: ["culture", "food", "leisure"],
    demo: true,
  },
  {
    id: "u-daniyar",
    name: "Данияр Ахметов",
    username: "daniyar.akh",
    email: "daniyar@oskemen.kz",
    bio: "Живу здесь всю жизнь. Знаю, где начинается хороший вечер, и показываю город друзьям без открыточных клише.",
    city: "Өскемен",
    joinedAt: "2025-01-21",
    avatarColor: "linear-gradient(135deg, #E8B06B 0%, #7A4A1E 100%)",
    interests: ["food", "entertainment", "sport"],
    demo: true,
  },
  {
    id: "u-aidos",
    name: "Айдос Сериков",
    username: "aidos.serikov",
    email: "aidos@oskemen.kz",
    bio: "Бегаю по набережной по утрам. Верю, что лучший способ узнать город — пройти его пешком.",
    city: "Өскемен",
    joinedAt: "2025-03-09",
    avatarColor: "linear-gradient(135deg, #5ED0E8 0%, #1B6374 100%)",
    interests: ["sport", "nature", "leisure"],
    demo: true,
  },
];

export const userMap = Object.fromEntries(seedUsers.map((user) => [user.id, user])) as Record<
  string,
  User
>;

export const demoAccount = {
  email: "demo@oskemen.kz",
  password: "demo1234",
};

export const defaultInterests: CategoryId[] = ["culture", "food", "nature"];
