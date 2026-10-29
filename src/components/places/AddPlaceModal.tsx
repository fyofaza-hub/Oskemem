import { useEffect, useRef, useState } from "react";
import type { CategoryId, Companion, Place, PriceLevel } from "@/types";
import { categories, companionOptions } from "@/data/categories";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/context/ToastContext";
import { cn, compressImage, validateImageFile } from "@/lib/utils";
import { track } from "@/lib/analytics";
import { tr } from "@/i18n/runtime";
import { Modal } from "@/components/ui/Modal";
import { Button, IconButton } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { categoryIconNames } from "@/components/ui/Category";
import { MapView } from "@/components/map/MapView";

interface AddPlaceModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (place: Place) => void;
  initialCoords?: [number, number] | null;
}

const CITY_CENTER: [number, number] = [49.9481, 82.6286];

const priceOptions: Array<{ value: PriceLevel; label: string; hint: string }> = [
  { value: 0, label: tr("Бесплатно"), hint: tr("парк, набережная, прогулка") },
  { value: 1, label: "₸", hint: tr("кофе или перекус") },
  { value: 2, label: "₸₸", hint: tr("ужин или билет") },
  { value: 3, label: "₸₸₸", hint: tr("премиум-вечер") },
];

const districtOptions = [tr("Центр"), tr("Стрелка"), tr("Студгородок"), tr("Шмелёв Лог"), tr("Левый берег"), tr("Октябрьский")];

const defaultCompanions: Companion[] = ["solo", "couple", "friends", "family"];

export function AddPlaceModal({ open, onClose, onCreated, initialCoords }: AddPlaceModalProps) {
  const { addPlace, currentUser } = useApp();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<CategoryId>("food");
  const [district, setDistrict] = useState(tr("Центр"));
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [priceLevel, setPriceLevel] = useState<PriceLevel>(1);
  const [companions, setCompanions] = useState<Companion[]>(defaultCompanions);
  const [tags, setTags] = useState("");
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setName("");
    setCategory("food");
    setDistrict(tr("Центр"));
    setAddress("");
    setDescription("");
    setPriceLevel(1);
    setCompanions(defaultCompanions);
    setTags("");
    setCoords(initialCoords ?? null);
    setImage(null);
    setUploading(false);
    setSubmitting(false);
  }, [open, initialCoords]);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    const validationError = validateImageFile(file);
    if (validationError) {
      toast({ title: validationError, variant: "error" });
      return;
    }
    setUploading(true);
    try {
      setImage(await compressImage(file, 1200, 0.8));
    } catch {
      toast({ title: tr("Не удалось обработать изображение"), variant: "error" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const toggleCompanion = (value: Companion) => {
    setCompanions((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]));
  };

  const submit = () => {
    if (!currentUser) {
      toast({ title: tr("Войдите, чтобы добавить место"), description: tr("Это займёт пару секунд."), variant: "info" });
      return;
    }
    if (name.trim().length < 2) {
      toast({ title: tr("Как называется место?"), variant: "error" });
      return;
    }
    if (!coords) {
      toast({
        title: tr("Поставьте точку на карте"),
        description: tr("Нажмите на карту в том месте, где находится ваша находка."),
        variant: "error",
      });
      return;
    }
    if (description.trim().length < 12) {
      toast({
        title: tr("Добавьте пару слов о месте"),
        description: tr("Хотя бы одно предложение — чем оно особенное."),
        variant: "error",
      });
      return;
    }
    setSubmitting(true);
    const result = addPlace({
      name,
      category,
      district,
      address,
      description,
      shortDescription: "",
      coords,
      image: image ?? "",
      tags: tags
        .split(",")
        .map((tag) => tag.trim().replace(/^#/, ""))
        .filter(Boolean),
      priceLevel,
      companions,
    });
    setSubmitting(false);
    if (!result.ok || !result.place) {
      toast({ title: tr("Не удалось добавить место"), description: result.error, variant: "error" });
      return;
    }
    track("place_added", { place_id: result.place.id, category: result.place.category });
    toast({
      title: tr("Место добавлено"),
      description: tr("«{name}» уже на карте, в гиде и доступно для маршрутов.", { name: result.place.name }),
    });
    onCreated?.(result.place);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={tr("Добавить своё место")}
      description={tr("Поставьте точку на карте и расскажите, чем это место важно. Оно сразу появится в гиде, на карте и в конструкторе маршрутов.")}
      size="xl"
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-meta text-muted">
            <Icon name="info" size={14} className="shrink-0" />
            {tr("Удалить его сможете только вы.")}
          </p>
          <div className="flex gap-2 sm:shrink-0">
            <Button variant="secondary" onClick={onClose} className="flex-1 sm:flex-none">
              {tr("Отмена")}
            </Button>
            <Button variant="primary" icon="plus" onClick={submit} disabled={uploading} loading={submitting} className="flex-1 sm:flex-none">
              {submitting ? tr("Добавляем…") : tr("Добавить место")}
            </Button>
          </div>
        </div>
      }
    >
      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="relative h-[260px] overflow-hidden rounded-2xl border border-line sm:h-[300px]">
              <MapView
                markers={[]}
                center={initialCoords ?? CITY_CENTER}
                zoom={initialCoords ? 16 : 13}
                fitToMarkers={false}
                showLocate={false}
                className="h-full"
                onMapClick={(value) => setCoords(value)}
                pickMarker={coords ? { coords, label: name || tr("Ваше место") } : null}
              />
              {!coords ? (
                <p className="pointer-events-none absolute inset-x-3 bottom-3 z-[65] rounded-xl bg-surface/95 px-3 py-2 text-meta text-muted shadow-card">
                  {tr("Найдите место на карте и нажмите на него. Координаты сохранятся автоматически.")}
                </p>
              ) : (
                <div className="absolute inset-x-3 bottom-3 z-[65] flex items-center justify-between gap-2 rounded-xl bg-surface/95 px-3 py-2 shadow-card">
                  <span className="flex items-center gap-1.5 text-meta font-medium text-accent-ink">
                    <Icon name="check" size={14} />
                    {tr("Точка выбрана")}
                  </span>
                  <span className="tabular-nums text-meta text-muted">
                    {coords[0].toFixed(5)}, {coords[1].toFixed(5)}
                  </span>
                </div>
              )}
            </div>
            {coords ? (
              <Button variant="ghost" size="sm" icon="close" onClick={() => setCoords(null)}>
                {tr("Сбросить точку")}
              </Button>
            ) : null}
          </div>

          <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-sunken">
            {image ? (
              <img src={image} alt={tr("Предпросмотр места")} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-muted">
                <Icon name="camera" size={24} />
                <p className="text-sm">{tr("Фото вашего места")}</p>
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => void handleFile(event.target.files?.[0])}
          />
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon="upload"
              loading={uploading}
              onClick={() => fileRef.current?.click()}
              className="flex-1"
            >
              {uploading ? tr("Обработка…") : image ? tr("Заменить фото") : tr("Загрузить фото")}
            </Button>
            {image ? (
              <IconButton icon="trash" label={tr("Убрать фото")} variant="bordered" size="sm" onClick={() => setImage(null)} />
            ) : null}
          </div>
          <p className="text-meta leading-relaxed text-muted">
            {tr("Необязательно. Без фото покажем общий вид города. Загружайте только свои снимки.")}
          </p>
        </div>

        <div className="min-w-0 space-y-5">
          <Field id="place-name" label={tr("Название места")}>
            <Input
              id="place-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={70}
              placeholder={tr("Например: кофейня у набережной")}
            />
          </Field>

          <div>
            <p className="field-label">{tr("Категория")}</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
              {categories.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={category === item.id}
                  onClick={() => setCategory(item.id)}
                  className={cn(
                    "flex h-10 items-center gap-2 rounded-xl border px-3 text-left text-sm font-medium transition-colors",
                    category === item.id
                      ? "border-accent bg-accent-soft text-accent-ink"
                      : "border-line bg-surface text-muted hover:border-line-strong hover:text-fg",
                  )}
                >
                  <Icon name={categoryIconNames[item.id]} size={16} className="shrink-0" />
                  <span className="truncate">{item.shortLabel}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="place-district" label={tr("Район")}>
              <Input
                id="place-district"
                value={district}
                onChange={(event) => setDistrict(event.target.value)}
                list="place-districts"
                maxLength={40}
              />
              <datalist id="place-districts">
                {districtOptions.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </Field>
            <Field id="place-address" label={tr("Адрес или ориентир")}>
              <Input
                id="place-address"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                maxLength={90}
                placeholder={tr("Улица, дом")}
              />
            </Field>
          </div>

          <Field id="place-description" label={tr("Чем это место особенное")} hint={`${description.length}/700 · ${tr("Минимум одно предложение")}`}>
            <Textarea
              id="place-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={700}
              rows={4}
              placeholder={tr("Что здесь стоит увидеть, попробовать или почувствовать? Личный опыт, без выдуманных фактов.")}
            />
          </Field>

          <div>
            <p className="field-label">{tr("Бюджет")}</p>
            <div className="grid grid-cols-4 gap-2">
              {priceOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={priceLevel === option.value}
                  title={option.hint}
                  onClick={() => setPriceLevel(option.value)}
                  className={cn(
                    "h-10 rounded-xl border text-sm font-medium transition-colors",
                    priceLevel === option.value
                      ? "border-accent bg-accent-soft text-accent-ink"
                      : "border-line bg-surface text-muted hover:border-line-strong hover:text-fg",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="field-hint">{priceOptions.find((option) => option.value === priceLevel)?.hint}</p>
          </div>

          <div>
            <p className="field-label">{tr("С кем хорошо")}</p>
            <div className="flex flex-wrap gap-2">
              {companionOptions.map((option) => {
                const active = companions.includes(option.id);
                return (
                  <Chip key={option.id} aria-pressed={active} active={active} onClick={() => toggleCompanion(option.id)}>
                    {option.label}
                  </Chip>
                );
              })}
            </div>
          </div>

          <Field id="place-tags" label={tr("Теги через запятую")}>
            <Input
              id="place-tags"
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              maxLength={90}
              placeholder={tr("кофе, вид, тихо")}
            />
          </Field>
        </div>
      </div>
    </Modal>
  );
}
