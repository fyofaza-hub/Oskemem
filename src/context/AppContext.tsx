import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  CategoryId,
  CityEvent,
  Comment,
  Place,
  PlaceInput,
  Post,
  ProfileUpdate,
  Route,
  RouteDraft,
  RouteStop,
  SiteSettings,
  User,
} from "@/types";
import { places as seedPlaces } from "@/data/places";
import { seedEvents } from "@/data/events";
import { seedPosts } from "@/data/posts";
import { seedRoutes } from "@/data/routes";
import { demoAccount, defaultInterests, seedUsers } from "@/data/users";
import { addMinutes, cartesianRoute, normalize, uid } from "@/lib/utils";
import { randomSalt, sha256Hex, isLegacyPassword } from "@/lib/security";
import { supabaseConfigured, pushUserDataChange, type UserDataKind } from "@/lib/supabase";
import { isValidEmail, isValidPassword, sanitizeText } from "@/lib/validation";
import { tr } from "@/i18n/runtime";
import {
  localizeEvent,
  localizePlace,
  localizePost,
  localizeRoute,
  localizeUser,
} from "@/i18n/content";

const STORAGE_KEY = "oskemen-culture-state-v1";
const STATE_VERSION = 3;

interface Account {
  email: string;
  /** Хэш актуального формата: sha256(salt + пароль). */
  passwordHash?: string;
  salt?: string;
  /**
   * Пароль старых аккаунтов (до внедрения хэширования). Поля нельзя считать
   * безопасным хранением: при первом же успешном входе/миграции значение
   * заменяется на hash+salt, поэтому дольше жизни сессии не живёт.
   */
  password?: string;
  userId: string;
}

interface StoreState {
  version: number;
  users: User[];
  accounts: Account[];
  currentUserId: string | null;
  posts: Post[];
  customPlaces: Place[];
  customRoutes: Route[];
  favorites: Record<string, string[]>;
  savedPosts: Record<string, string[]>;
  savedRoutes: Record<string, string[]>;
  savedEvents: Record<string, string[]>;
  draft: RouteDraft | null;
  siteSettings: SiteSettings;
  /** Переопределения обложек seed-мест из админки (не касаясь массивов сидов). */
  placeImageOverrides: Record<string, string>;
}

interface ActionResult {
  ok: boolean;
  error?: string;
}

interface CreatePostInput {
  title: string;
  text: string;
  placeId: string;
  category: CategoryId;
  image: string;
}

interface AuthResult extends ActionResult {
  user?: User;
}

interface AddPlaceResult extends ActionResult {
  place?: Place;
}

interface AppContextValue {
  users: User[];
  currentUser: User | null;
  profileUser: User | null;
  /** Доступ к интерактиву открыт: обучение пройдено/пропущено (профиль + localStorage). */
  onboarded: boolean;
  completeOnboarding: () => void;
  /** Google-сессия: создаст/уберёт зеркало профиля и переключит пользователя. */
  setSupabaseUser: (user: import("@/types").User | null) => void;
  places: Place[];
  placeMap: Record<string, Place>;
  posts: Post[];
  routes: Route[];
  events: CityEvent[];
  favorites: string[];
  savedPostIds: string[];
  savedRouteIds: string[];
  savedEventIds: string[];
  draft: RouteDraft | null;
  siteSettings: SiteSettings;
  placeImageOverrides: Record<string, string>;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (name: string, email: string, password: string) => Promise<AuthResult>;
  logout: () => void;
  updateProfile: (update: ProfileUpdate) => ActionResult;
  toggleFavorite: (placeId: string) => void;
  toggleLike: (postId: string) => void;
  toggleSavePost: (postId: string) => void;
  toggleSaveRoute: (routeId: string) => void;
  toggleSaveEvent: (eventId: string) => void;
  addComment: (postId: string, text: string) => Comment | null;
  createPost: (input: CreatePostInput) => Post | null;
  addPlace: (input: PlaceInput) => AddPlaceResult;
  deletePlace: (placeId: string) => ActionResult;
  /** Замена обложки места (админ-инструмент Шаг 2): dataURL локально или публичный URL из Storage. */
  setPlaceImage: (placeId: string, image: string) => ActionResult;
  getUser: (id: string) => User | undefined;
  getRoute: (id: string) => Route | undefined;
  startDraft: (placeIds?: string[], options?: { title?: string; description?: string }) => void;
  updateDraft: (patch: Partial<RouteDraft>) => void;
  addPlaceToDraft: (placeId: string) => "added" | "exists" | "no-auth";
  removeStop: (placeId: string) => void;
  reorderStops: (from: number, to: number) => void;
  updateStop: (placeId: string, patch: Partial<RouteStop>) => void;
  clearDraft: () => void;
  saveDraftAsRoute: () => Route | null;
  copyRoute: (routeId: string) => Route | null;
  resetDemo: () => void;
  approvePost: (postId: string) => void;
  rejectPost: (postId: string) => void;
  moderatePosts: (ids: string[], action: "approve" | "reject") => void;
  deletePost: (postId: string) => void;
  setUserRole: (userId: string, role: "user" | "admin") => void;
  banUser: (userId: string, banned: boolean) => void;
  updateSiteSettings: (patch: Partial<SiteSettings>) => void;
}

const createInitialState = (): StoreState => ({
  version: STATE_VERSION,
  users: seedUsers,
  accounts: [
    {
      email: demoAccount.email,
      password: demoAccount.password,
      userId: "u-alina",
    },
    {
      // Фиксированный администратор: email/пароль прописаны в ТЗ и миграции
      // supabase/001_admin_roles_storage.sql. При первом старте миграция
      // хэширует пароль (salt+sha256), при сбросе данных аккаунт восстанавливается.
      email: "admin@oskemen.culture",
      password: "SuperAdmin2026Password!",
      userId: "u-admin",
    },
  ],
  currentUserId: "u-alina",
  posts: seedPosts,
  customPlaces: [],
  customRoutes: [],
  favorites: {
    "u-alina": ["place-embankment", "place-theatre", "place-zebra"],
  },
  savedPosts: {
    "u-alina": ["post-4", "post-7"],
  },
  savedRoutes: {
    "u-alina": ["route-culture"],
  },
  savedEvents: {
    "u-alina": ["event-sunset"],
  },
  draft: null,
  siteSettings: {
    siteTitle: "Oskemen Culture",
    maintenanceMode: false,
    postingEnabled: true,
  },
  placeImageOverrides: {},
});

const loadState = (): StoreState => {
  if (typeof window === "undefined") return createInitialState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw) as StoreState;
    if (!parsed || parsed.version !== STATE_VERSION) return createInitialState();
    return {
      ...createInitialState(),
      ...parsed,
      users: parsed.users?.length ? parsed.users : seedUsers,
      accounts: parsed.accounts?.length ? parsed.accounts : [],
      posts: parsed.posts?.length ? parsed.posts : seedPosts,
      customPlaces: parsed.customPlaces ?? [],
      customRoutes: parsed.customRoutes ?? [],
      favorites: parsed.favorites ?? {},
      savedPosts: parsed.savedPosts ?? {},
      savedRoutes: parsed.savedRoutes ?? {},
      savedEvents: parsed.savedEvents ?? {},
      draft: parsed.draft ?? null,
      siteSettings: parsed.siteSettings ?? createInitialState().siteSettings,
      placeImageOverrides: parsed.placeImageOverrides ?? {},
    };
  } catch {
    return createInitialState();
  }
};

const AppContext = createContext<AppContextValue | null>(null);

const seedPostIds = new Set(seedPosts.map((post) => post.id));
const seedUserIds = new Set(seedUsers.map((user) => user.id));

const ensureList = (record: Record<string, string[]>, userId: string) => record[userId] ?? [];

/** Пользователь текущей сессии пришёл из Supabase Auth (Google)? */
const currentUserIdIsSupabase = (state: StoreState): boolean => {
  const user = state.users.find((item) => item.id === state.currentUserId);
  return Boolean(user?.isSupabase) && supabaseConfigured;
};

/** Пуш изменения пользовательских данных в Supabase (США-совместимость best-effort). */
const maybePushUserChange = (
  state: StoreState,
  kind: UserDataKind,
  rowId: string,
  isAdd: boolean,
): void => {
  if (!state.currentUserId) return;
  void pushUserDataChange(kind, state.currentUserId, rowId, isAdd ? "add" : "remove");
};

const toggleInList = (list: string[], id: string) =>
  list.includes(id) ? list.filter((item) => item !== id) : [id, ...list];

const palette = [
  "linear-gradient(135deg, #4D8DFF 0%, #1C4CA8 100%)",
  "linear-gradient(135deg, #6BB7A0 0%, #1E5147 100%)",
  "linear-gradient(135deg, #B49CFF 0%, #4E3A8E 100%)",
  "linear-gradient(135deg, #E8B06B 0%, #7A4A1E 100%)",
  "linear-gradient(135deg, #5ED0E8 0%, #1B6374 100%)",
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoreState>(loadState);

  // Разовая миграция: у легаси-аккаунтов открытый пароль заменяется на salt+hash.
  useEffect(() => {
    const legacy = state.accounts.filter((account) => !account.passwordHash && isLegacyPassword(account.password));
    if (!legacy.length) return;
    let cancelled = false;
    void (async () => {
      const upgraded = await Promise.all(
        legacy.map(async (account) => {
          const salt = randomSalt();
          const passwordHash = await sha256Hex(salt + (account.password ?? ""));
          return { email: account.email, salt, passwordHash };
        }),
      );
      if (cancelled) return;
      setState((prev) => ({
        ...prev,
        accounts: prev.accounts.map((account) => {
          const found = upgraded.find((item) => item.email === account.email);
          return found && !account.passwordHash
            ? { ...account, salt: found.salt, passwordHash: found.passwordHash, password: undefined }
            : account;
        }),
      }));
    })();
    return () => {
      cancelled = true;
    };
  }, [state.accounts]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      window.dispatchEvent(new CustomEvent("oskemen:storage-error"));
    }
  }, [state]);

  const rawCurrentUser = useMemo(
    () => state.users.find((user) => user.id === state.currentUserId) ?? null,
    [state.currentUserId, state.users],
  );

  const users = useMemo(
    () => state.users.map((user) => (seedUserIds.has(user.id) ? localizeUser(user) : user)),
    [state.users],
  );

  const currentUser = useMemo(
    () => (rawCurrentUser ? users.find((user) => user.id === rawCurrentUser.id) ?? null : null),
    [rawCurrentUser, users],
  );

  const places = useMemo(() => {
    const overrides = state.placeImageOverrides;
    if (!Object.keys(overrides).length) {
      return [...state.customPlaces, ...seedPlaces.map(localizePlace)];
    }
    // Замена фото из админки применяется мгновенно ко всем разделам:
    // гид, карта, лента и главная получают новую обложку по place.id.
    return [...state.customPlaces, ...seedPlaces.map((place) => {
      const localized = localizePlace(place);
      const override = overrides[localized.id];
      return override ? { ...localized, image: override } : localized;
    })];
  }, [state.customPlaces, state.placeImageOverrides]);

  const placeMap = useMemo(
    () =>
      Object.fromEntries(places.map((place) => [place.id, place])) as Record<string, Place>,
    [places],
  );

  const routes = useMemo(
    () => [...state.customRoutes, ...seedRoutes.map(localizeRoute)],
    [state.customRoutes],
  );

  const posts = useMemo(
    () =>
      state.posts.map((post) => (seedPostIds.has(post.id) ? localizePost(post) : post)),
    [state.posts],
  );

  const events = useMemo(() => seedEvents.map(localizeEvent), []);

  const getUser = useCallback(
    (id: string) => users.find((user) => user.id === id),
    [users],
  );

  const getRoute = useCallback(
    (id: string) => routes.find((route) => route.id === id),
    [routes],
  );

  const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const cleanEmail = sanitizeText(email);
    if (!isValidEmail(cleanEmail)) {
      return { ok: false, error: tr("Проверьте формат почты") };
    }
    if (!isValidPassword(password)) {
      return { ok: false, error: tr("Пароль должен содержать только латиницу, цифры и символы, минимум 8 символов") };
    }
    const normalizedEmail = normalize(cleanEmail);
    const account = state.accounts.find(
      (item) => normalize(item.email) === normalizedEmail,
    );
    if (!account) {
      return { ok: false, error: tr("Аккаунт с такой почтой не найден") };
    }
    // Хэш-аккаунт: sha256(salt + пароль). Легаси: сравнение в открытом виде, но
    // при первом же успешном входе пароль немедленно заменяется на хэш.
    let passwordMatch = false;
    if (account.passwordHash && account.salt) {
      passwordMatch = (await sha256Hex(account.salt + password)) === account.passwordHash;
    } else if (isLegacyPassword(account.password)) {
      passwordMatch = account.password === password;
    } else {
      return { ok: false, error: tr("Неверный пароль") };
    }
    if (!passwordMatch) {
      return { ok: false, error: tr("Неверный пароль") };
    }
    const user = state.users.find((item) => item.id === account.userId);
    if (!user) return { ok: false, error: tr("Профиль не найден") };
    if (user.banned) return { ok: false, error: tr("Аккаунт заблокирован") };

    // Апгрейд легаси-аккаунта до hash-формата сразу после успешного входа.
    if (!account.passwordHash || !account.salt) {
      const salt = randomSalt();
      const passwordHash = await sha256Hex(salt + password);
      setState((prev) => ({
        ...prev,
        accounts: prev.accounts.map((item) =>
          item.email === account.email ? { ...item, passwordHash, salt, password: undefined } : item,
        ),
      }));
    }

    setState((prev) => ({ ...prev, currentUserId: user.id }));
    return { ok: true, user };
  }, [state.accounts, state.users]);

  const register = useCallback(async (name: string, email: string, password: string): Promise<AuthResult> => {
    const trimmedName = sanitizeText(name);
    const cleanEmail = sanitizeText(email);
    if (trimmedName.length < 2) return { ok: false, error: tr("Укажите имя") };
    if (!isValidEmail(cleanEmail)) {
      return { ok: false, error: tr("Проверьте формат почты") };
    }
    if (!isValidPassword(password)) {
      return { ok: false, error: tr("Пароль должен содержать только латиницу, цифры и символы, минимум 8 символов") };
    }
    const normalizedEmail = normalize(cleanEmail);
    if (state.accounts.some((account) => normalize(account.email) === normalizedEmail)) {
      return { ok: false, error: tr("Эта почта уже зарегистрирована") };
    }
    const baseUsername = normalizedEmail.split("@")[0].replace(/[^a-z0-9._-]/g, "") || "user";
    let username = baseUsername;
    let counter = 1;
    while (state.users.some((user) => user.username === username)) {
      username = `${baseUsername}${counter}`;
      counter += 1;
    }
    const salt = randomSalt();
    const passwordHash = await sha256Hex(salt + password);
    const newUser: User = {
      id: uid("u"),
      name: trimmedName,
      username,
      email: cleanEmail,
      bio: tr("Новый участник Oskemen Culture."),
      city: tr("Өскемен"),
      joinedAt: new Date().toISOString(),
      avatarColor: palette[state.users.length % palette.length],
      interests: defaultInterests,
      role: "user",
      isOnboarded: false,
    };
    setState((prev) => ({
      ...prev,
      users: [...prev.users, newUser],
      accounts: [
        ...prev.accounts,
        { email: cleanEmail, passwordHash, salt, userId: newUser.id },
      ],
      currentUserId: newUser.id,
    }));
    return { ok: true, user: newUser };
  }, [state.accounts, state.users]);

  const logout = useCallback(() => {
    setState((prev) => ({ ...prev, currentUserId: null }));
  }, []);

  /** Пользователь прошёл или пропустил обучение — открыть интерактив (профиль + localStorage). */
  const completeOnboarding = useCallback(() => {
    setState((prev) => ({
      ...prev,
      users: prev.users.map((user) =>
        user.id === prev.currentUserId ? { ...user, isOnboarded: true } : user,
      ),
    }));
  }, []);

  /**
   * Шаг 1: Google-сессия → профиль приложения.
   * • профиль Google-пользователя зеркалируется в users[] (единая модель),
   * • после редиректа шапка сразу меняет «Войти» на аватар,
   * • выход из Google освобождает текущего пользователя.
   */
  const setSupabaseUser = useCallback((user: import("@/types").User | null): void => {
    setState((prev) => {
      if (!user) {
        const wasSupabase = prev.users.find(
          (item) => item.id === prev.currentUserId && item.isSupabase,
        );
        return wasSupabase ? { ...prev, currentUserId: null } : prev;
      }
      const existing = prev.users.find((item) => item.id === user.id);
      const mirror: User = existing
        // Повторный вход: обновляем только меняющиеся Google-поля
        ? { ...existing, name: user.name, avatar: user.avatar, isSupabase: true }
        : { ...user, isSupabase: true };
      return {
        ...prev,
        users: existing
          ? prev.users.map((item) => (item.id === user.id ? mirror : item))
          : [...prev.users, mirror],
        currentUserId: user.id,
      };
    });
  }, []);

  const updateProfile = useCallback(
    (update: ProfileUpdate): ActionResult => {
      if (!state.currentUserId) return { ok: false, error: tr("Сначала войдите в аккаунт") };
      const name = update.name.trim();
      const username = update.username.replace(/^@/, "").trim();
      if (name.length < 2) return { ok: false, error: tr("Имя должно быть длиннее") };
      if (username.length < 3) return { ok: false, error: tr("Username слишком короткий") };
      if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
        return { ok: false, error: tr("В username можно использовать латиницу, цифры, точку и _") };
      }
      if (
        state.users.some(
          (user) => user.id !== state.currentUserId && user.username === username,
        )
      ) {
        return { ok: false, error: tr("Этот username уже занят") };
      }
      setState((prev) => ({
        ...prev,
        users: prev.users.map((user) =>
          user.id === prev.currentUserId
            ? {
                ...user,
                name,
                username,
                bio: update.bio.trim(),
                city: update.city.trim() || user.city,
                avatar: update.avatar,
                avatarColor: update.avatarColor ?? user.avatarColor,
                interests: update.interests ?? user.interests,
              }
            : user,
        ),
      }));
      return { ok: true };
    },
    [state.currentUserId, state.users],
  );

  const toggleFavorite = useCallback((placeId: string) => {
    setState((prev) => {
      if (!prev.currentUserId) return prev;
      const current = ensureList(prev.favorites, prev.currentUserId);
      if (currentUserIdIsSupabase(prev)) {
        void maybePushUserChange(prev, "favorites", placeId, !current.includes(placeId));
      }
      return {
        ...prev,
        favorites: {
          ...prev.favorites,
          [prev.currentUserId]: toggleInList(current, placeId),
        },
      };
    });
  }, []);

  const toggleLike = useCallback((postId: string) => {
    setState((prev) => {
      if (!prev.currentUserId) return prev;
      return {
        ...prev,
        posts: prev.posts.map((post) => {
          if (post.id !== postId) return post;
          const liked = post.likedBy.includes(prev.currentUserId!);
          return {
            ...post,
            likedBy: liked
              ? post.likedBy.filter((id) => id !== prev.currentUserId)
              : [...post.likedBy, prev.currentUserId!],
          };
        }),
      };
    });
  }, []);

  const toggleSavePost = useCallback((postId: string) => {
    setState((prev) => {
      if (!prev.currentUserId) return prev;
      return {
        ...prev,
        savedPosts: {
          ...prev.savedPosts,
          [prev.currentUserId]: toggleInList(
            ensureList(prev.savedPosts, prev.currentUserId),
            postId,
          ),
        },
      };
    });
  }, []);

  const toggleSaveRoute = useCallback((routeId: string) => {
    setState((prev) => {
      if (!prev.currentUserId) return prev;
      return {
        ...prev,
        savedRoutes: {
          ...prev.savedRoutes,
          [prev.currentUserId]: toggleInList(
            ensureList(prev.savedRoutes, prev.currentUserId),
            routeId,
          ),
        },
      };
    });
  }, []);

  const toggleSaveEvent = useCallback((eventId: string) => {
    setState((prev) => {
      if (!prev.currentUserId) return prev;
      return {
        ...prev,
        savedEvents: {
          ...prev.savedEvents,
          [prev.currentUserId]: toggleInList(
            ensureList(prev.savedEvents, prev.currentUserId),
            eventId,
          ),
        },
      };
    });
  }, []);

  const addComment = useCallback(
    (postId: string, text: string) => {
      if (!state.currentUserId || !text.trim()) return null;
      const comment: Comment = {
        id: uid("comment"),
        userId: state.currentUserId,
        text: text.trim(),
        createdAt: new Date().toISOString(),
      };
      setState((prev) => ({
        ...prev,
        posts: prev.posts.map((post) =>
          post.id === postId ? { ...post, comments: [...post.comments, comment] } : post,
        ),
      }));
      return comment;
    },
    [state.currentUserId],
  );

  const createPost = useCallback(
    (input: CreatePostInput) => {
      if (!state.currentUserId) return null;
      if (!state.siteSettings.postingEnabled) return null;
      const place = placeMap[input.placeId];
      const post: Post = {
        id: uid("post"),
        userId: state.currentUserId,
        placeId: input.placeId,
        title: sanitizeText(input.title),
        text: sanitizeText(input.text),
        image: input.image || place?.image || "/images/panorama.webp",
        category: input.category,
        createdAt: new Date().toISOString(),
        baseLikes: 0,
        likedBy: [],
        comments: [],
        approved: false,
      };
      setState((prev) => ({ ...prev, posts: [post, ...prev.posts] }));
      return post;
    },
    [state.currentUserId, placeMap, state.siteSettings.postingEnabled],
  );

  const addPlace = useCallback(
    (input: PlaceInput): AddPlaceResult => {
      if (!state.currentUserId) {
        return { ok: false, error: tr("Войдите, чтобы добавить своё место") };
      }
      const name = input.name.trim();
      const description = input.description.trim();
      if (name.length < 2) return { ok: false, error: tr("Название слишком короткое") };
      if (description.length < 12) {
        return { ok: false, error: tr("Добавьте описание — хотя бы одно предложение") };
      }
      if (!Number.isFinite(input.coords[0]) || !Number.isFinite(input.coords[1])) {
        return { ok: false, error: tr("Поставьте точку на карте") };
      }
      const place: Place = {
        id: uid("place"),
        name,
        category: input.category,
        district: input.district.trim() || tr("Өскемен"),
        address: input.address.trim() || tr("Точка на карте"),
        description,
        shortDescription:
          input.shortDescription.trim() || `${description.slice(0, 92)}${description.length > 92 ? "…" : ""}`,
        coords: input.coords,
        image: input.image || "/images/panorama.webp",
        tags: input.tags.map((tag) => tag.trim()).filter(Boolean).slice(0, 6),
        priceLevel: input.priceLevel,
        companions: input.companions.length
          ? input.companions
          : ["solo", "couple", "friends", "family"],
        source: "community",
        createdBy: state.currentUserId,
        createdAt: new Date().toISOString(),
        photoCredit: tr("Фото добавлено участником сообщества"),
      };
      setState((prev) => ({
        ...prev,
        customPlaces: [place, ...prev.customPlaces],
      }));
      return { ok: true, place };
    },
    [state.currentUserId],
  );

  const deletePlace = useCallback(
    (placeId: string): ActionResult => {
      if (!state.currentUserId) return { ok: false, error: tr("Сначала войдите в аккаунт") };
      const target = state.customPlaces.find((place) => place.id === placeId);
      if (!target) return { ok: false, error: tr("Это место нельзя удалить") };
      if (target.createdBy !== state.currentUserId) {
        return { ok: false, error: tr("Удалять можно только свои места") };
      }
      setState((prev) => {
        const strip = (list: string[]) => list.filter((id) => id !== placeId);
        const favorites = Object.fromEntries(
          Object.entries(prev.favorites).map(([userId, list]) => [userId, strip(list)]),
        );
        const draft = prev.draft
          ? { ...prev.draft, stops: prev.draft.stops.filter((stop) => stop.placeId !== placeId) }
          : null;
        const customRoutes = prev.customRoutes.map((route) => ({
          ...route,
          stops: route.stops.filter((stop) => stop.placeId !== placeId),
        }));
        return {
          ...prev,
          customPlaces: prev.customPlaces.filter((place) => place.id !== placeId),
          favorites,
          draft,
          customRoutes,
        };
      });
      return { ok: true };
    },
    [state.currentUserId, state.customPlaces],
  );

  const startDraft = useCallback(
    (placeIds: string[] = [], options?: { title?: string; description?: string }) => {
      const stops: RouteStop[] = placeIds
        .filter((id) => placeMap[id])
        .map((placeId, index) => ({
          placeId,
          time: addMinutes("14:00", index * 75),
          note: "",
        }));
      const categories = Array.from(
        new Set(stops.map((stop) => placeMap[stop.placeId].category)),
      ) as CategoryId[];
      setState((prev) => ({
        ...prev,
        draft: {
          title: options?.title ?? tr("Мой маршрут"),
          description: options?.description ?? "",
          categories,
          stops,
          cover: stops[0] ? placeMap[stops[0].placeId].image : "/images/embankment.webp",
          startTime: "14:00",
        },
      }));
    },
    [placeMap],
  );

  const updateDraft = useCallback((patch: Partial<RouteDraft>) => {
    setState((prev) => {
      if (!prev.draft) return prev;
      return { ...prev, draft: { ...prev.draft, ...patch } };
    });
  }, []);

  const addPlaceToDraft = useCallback(
    (placeId: string): "added" | "exists" | "no-auth" => {
      if (!state.currentUserId) return "no-auth";
      if (!placeMap[placeId]) return "exists";
      if (state.draft?.stops.some((stop) => stop.placeId === placeId)) return "exists";
      const place = placeMap[placeId];
      const existing = state.draft;
      const baseTime = existing?.stops.length
        ? addMinutes(existing.stops[existing.stops.length - 1].time, 60)
        : "14:00";
      const draft: RouteDraft = existing
        ? {
            ...existing,
            categories: Array.from(
              new Set([...existing.categories, place.category]),
            ) as CategoryId[],
            stops: [...existing.stops, { placeId, time: baseTime, note: "" }],
          }
        : {
            title: tr("Мой маршрут"),
            description: "",
            categories: [place.category],
            stops: [{ placeId, time: "14:00", note: "" }],
            cover: place.image,
            startTime: "14:00",
          };
      setState((prev) => ({ ...prev, draft }));
      return "added";
    },
    [state.currentUserId, state.draft, placeMap],
  );

  const removeStop = useCallback(
    (placeId: string) => {
      setState((prev) => {
        if (!prev.draft) return prev;
        const stops = prev.draft.stops.filter((stop) => stop.placeId !== placeId);
        return {
          ...prev,
          draft: {
            ...prev.draft,
            stops,
            cover: stops[0] ? placeMap[stops[0].placeId]?.image ?? prev.draft.cover : prev.draft.cover,
          },
        };
      });
    },
    [placeMap],
  );

  const reorderStops = useCallback(
    (from: number, to: number) => {
      setState((prev) => {
        if (!prev.draft || to < 0 || to >= prev.draft.stops.length) return prev;
        const stops = [...prev.draft.stops];
        const [moved] = stops.splice(from, 1);
        stops.splice(to, 0, moved);
        return {
          ...prev,
          draft: {
            ...prev.draft,
            stops,
            cover: placeMap[stops[0]?.placeId]?.image ?? prev.draft.cover,
          },
        };
      });
    },
    [placeMap],
  );

  const updateStop = useCallback((placeId: string, patch: Partial<RouteStop>) => {
    setState((prev) => {
      if (!prev.draft) return prev;
      return {
        ...prev,
        draft: {
          ...prev.draft,
          stops: prev.draft.stops.map((stop) =>
            stop.placeId === placeId ? { ...stop, ...patch } : stop,
          ),
        },
      };
    });
  }, []);

  const clearDraft = useCallback(() => {
    setState((prev) => ({ ...prev, draft: null }));
  }, []);

  const saveDraftAsRoute = useCallback(() => {
    if (!state.currentUserId || !state.draft) return null;
    const { draft } = state;
    if (!draft.title.trim() || draft.stops.length < 2) return null;
    const stopPlaces = draft.stops
      .map((stop) => placeMap[stop.placeId])
      .filter(Boolean);
    if (!stopPlaces.length) return null;
    const categories = Array.from(
      new Set([
        ...draft.categories,
        ...stopPlaces.map((place) => place.category),
      ]),
    ) as CategoryId[];
    const toMinutes = (time: string) => {
      const [hours, minutes] = time.split(":").map(Number);
      return (Number.isFinite(hours) ? hours : 12) * 60 + (Number.isFinite(minutes) ? minutes : 0);
    };
    const firstTime = toMinutes(draft.stops[0]?.time ?? "12:00");
    const lastTime = toMinutes(draft.stops[draft.stops.length - 1]?.time ?? "13:00");
    const timeSpan = lastTime >= firstTime ? lastTime - firstTime : lastTime + 1440 - firstTime;
    const route: Route = {
      id: uid("route"),
      title: draft.title.trim(),
      description:
        draft.description.trim() ||
        tr("Маршрут, собранный из сохранённых мест. Время и порядок точек можно изменить."),
      authorId: state.currentUserId,
      cover: stopPlaces[0].image,
      categories,
      stops: draft.stops.map((stop) => ({ ...stop })),
      durationMin: Math.max(draft.stops.length * 30, timeSpan),
      distanceKm: cartesianRoute(stopPlaces.map((place) => place.coords)),
      isPublic: true,
      savedBy: [state.currentUserId],
      createdAt: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      customRoutes: [route, ...prev.customRoutes],
      savedRoutes: {
        ...prev.savedRoutes,
        [prev.currentUserId!]: Array.from(
          new Set([route.id, ...ensureList(prev.savedRoutes, prev.currentUserId!)]),
        ),
      },
      draft: null,
    }));
    return route;
  }, [state.currentUserId, state.draft, placeMap]);

  const copyRoute = useCallback(
    (routeId: string) => {
      if (!state.currentUserId) return null;
      const source = routes.find((route) => route.id === routeId);
      if (!source) return null;
      const copy: Route = {
        ...source,
        id: uid("route"),
        title: `${source.title} · ${tr("моя версия")}`,
        authorId: state.currentUserId,
        savedBy: [state.currentUserId],
        createdAt: new Date().toISOString(),
      };
      setState((prev) => ({
        ...prev,
        customRoutes: [copy, ...prev.customRoutes],
        savedRoutes: {
          ...prev.savedRoutes,
          [prev.currentUserId!]: Array.from(
            new Set([copy.id, ...ensureList(prev.savedRoutes, prev.currentUserId!)]),
          ),
        },
      }));
      return copy;
    },
    [routes, state.currentUserId],
  );

  const resetDemo = useCallback(() => {
    setState(createInitialState());
  }, []);

  const isAdmin = currentUser?.role === "admin";
  const onboarded = currentUser ? currentUser.isOnboarded !== false : true;

  const approvePost = useCallback((postId: string) => {
    setState((prev) => ({
      ...prev,
      posts: prev.posts.map((post) => (post.id === postId ? { ...post, approved: true } : post)),
    }));
  }, []);

  const rejectPost = useCallback((postId: string) => {
    setState((prev) => ({
      ...prev,
      posts: prev.posts.map((post) => (post.id === postId ? { ...post, approved: false } : post)),
    }));
  }, []);

  /** Массовая модерация для админ-панели: одобрить или отклонить набор постов. */
  const moderatePosts = useCallback((ids: string[], action: "approve" | "reject") => {
    const set = new Set(ids);
    setState((prev) => ({
      ...prev,
      posts: prev.posts.map((post) => (set.has(post.id) ? { ...post, approved: action === "approve" } : post)),
    }));
  }, []);

  const deletePost = useCallback((postId: string) => {
    setState((prev) => ({ ...prev, posts: prev.posts.filter((post) => post.id !== postId) }));
  }, []);

  const setUserRole = useCallback((userId: string, role: "user" | "admin") => {
    setState((prev) => ({
      ...prev,
      users: prev.users.map((user) => {
        // Фиксированный администратор не теряет роль никогда
        if (user.id === userId && user.isFixed) return user;
        return user.id === userId ? { ...user, role } : user;
      }),
    }));
  }, []);

  const banUser = useCallback((userId: string, banned: boolean) => {
    setState((prev) => ({
      ...prev,
      users: prev.users.map((user) => {
        // Фиксированный администратор не может быть заблокирован
        if (user.id === userId && user.isFixed) return user;
        return user.id === userId ? { ...user, banned } : user;
      }),
    }));
  }, []);

  const updateSiteSettings = useCallback((patch: Partial<SiteSettings>) => {
    setState((prev) => ({
      ...prev,
      siteSettings: { ...prev.siteSettings, ...patch },
    }));
  }, []);

  /** Шаг 2: замена обложки места с мгновенным эффектом во всех разделах. */
  const setPlaceImage = useCallback((placeId: string, image: string): ActionResult => {
    if (!image) return { ok: false, error: tr("Изображение пустое") };
    let isSeed = false;
    setState((prev) => {
      isSeed = state.customPlaces.some((place) => place.id === placeId);
      return {
        ...prev,
        // Сид-места хранятся локализуемыми, поэтому обложку правим оверрайдом
        placeImageOverrides: { ...prev.placeImageOverrides, [placeId]: image },
      };
    });
    void isSeed;
    return { ok: true };
  }, []);

  const contextValue = useMemo<AppContextValue>(
    () => ({
      users,
      currentUser,
      profileUser: rawCurrentUser,
      onboarded,
      completeOnboarding,
      setSupabaseUser,
      places,
      placeMap,
      routes,
      events,
      favorites: currentUser ? ensureList(state.favorites, currentUser.id) : [],
      posts,
      savedPostIds: currentUser ? ensureList(state.savedPosts, currentUser.id) : [],
      savedRouteIds: currentUser ? ensureList(state.savedRoutes, currentUser.id) : [],
      savedEventIds: currentUser ? ensureList(state.savedEvents, currentUser.id) : [],
      draft: state.draft,
      siteSettings: state.siteSettings,
      placeImageOverrides: state.placeImageOverrides,
      isAdmin,
      login,
      register,
      logout,
      updateProfile,
      toggleFavorite,
      toggleLike,
      toggleSavePost,
      toggleSaveRoute,
      toggleSaveEvent,
      addComment,
      createPost,
      addPlace,
      deletePlace,
      setPlaceImage,
      getUser,
      getRoute,
      startDraft,
      updateDraft,
      addPlaceToDraft,
      removeStop,
      reorderStops,
      updateStop,
      clearDraft,
      saveDraftAsRoute,
      copyRoute,
      resetDemo,
      approvePost,
      rejectPost,
      moderatePosts,
      deletePost,
      setUserRole,
      banUser,
      updateSiteSettings,
    }),
    [
      addComment,
      addPlace,
      addPlaceToDraft,
      clearDraft,
      copyRoute,
      createPost,
      currentUser,
      deletePlace,
      setPlaceImage,
      onboarded,
      completeOnboarding,
      events,
      getUser,
      getRoute,
      login,
      logout,
      moderatePosts,
      placeMap,
      places,
      setPlaceImage,
      posts,
      rawCurrentUser,
      register,
      reorderStops,
      resetDemo,
      routes,
      saveDraftAsRoute,
      startDraft,
      state.draft,
      state.favorites,
      state.savedEvents,
      state.savedPosts,
      state.savedRoutes,
      toggleFavorite,
      toggleLike,
      toggleSaveEvent,
      toggleSavePost,
      toggleSaveRoute,
      updateDraft,
      updateProfile,
      updateStop,
      removeStop,
      users,
    ],
  );

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};
