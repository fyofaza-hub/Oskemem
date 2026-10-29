import { useEffect, useRef, useState } from "react";
import type { Post } from "@/types";
import { categoryMap } from "@/data/categories";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/context/ToastContext";
import { compressImage, validateImageFile } from "@/lib/utils";
import { tr } from "@/i18n/runtime";
import { onboardingGate } from "@/components/onboarding/Onboarding";
import { Modal } from "@/components/ui/Modal";
import { Button, IconButton } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { CategoryIcon } from "@/components/ui/Category";

interface CreatePostModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (post: Post) => void;
  initialPlaceId?: string;
}

export function CreatePostModal({ open, onClose, onCreated, initialPlaceId }: CreatePostModalProps) {
  const { createPost, currentUser, places } = useApp();
  
  const { toast } = useToast();
  const [placeId, setPlaceId] = useState(initialPlaceId ?? places[0].id);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const selectedPlace = places.find((place) => place.id === placeId) ?? places[0];

  useEffect(() => {
    if (!open) return;
    setPlaceId(initialPlaceId ?? places[0].id);
    setTitle("");
    setText("");
    setImage(null);
  }, [open, initialPlaceId, places]);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    const validationError = validateImageFile(file);
    if (validationError) {
      toast({ title: validationError, variant: "error" });
      return;
    }
    setUploading(true);
    try {
      setImage(await compressImage(file, 1100, 0.78));
    } catch {
      toast({ title: tr("Не удалось обработать изображение"), variant: "error" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const submit = () => {
    if (!currentUser) {
      toast({ title: tr("Войдите, чтобы опубликовать открытие"), variant: "error" });
      return;
    }
    if (title.trim().length < 3) {
      toast({ title: tr("Добавьте заголовок"), description: tr("Минимум 3 символа."), variant: "error" });
      return;
    }
    if (text.trim().length < 10) {
      toast({
        title: tr("Расскажите чуть подробнее"),
        description: tr("Текст публикации — минимум 10 символов."),
        variant: "error",
      });
      return;
    }
    if (!onboardingGate.gate()) {
      return;
    }
    const post = createPost({
      title,
      text,
      placeId,
      category: selectedPlace.category,
      image: image ?? selectedPlace.image,
    });
    if (!post) {
      toast({ title: tr("Не удалось опубликовать"), variant: "error" });
      return;
    }
    toast({ title: tr("Опубликовано"), description: tr("«{title}» уже в ленте города.", { title: post.title }) });
    if (onCreated) {
      onCreated(post);
    } else {
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={tr("Новая публикация")}
      description={tr("Расскажите о месте, которое стоит увидеть. Публикация сохранится в этом браузере.")}
      size="lg"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose}>
            {tr("Отмена")}
          </Button>
          <Button variant="primary" icon="send" onClick={submit} disabled={uploading}>
            {tr("Опубликовать")}
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-3">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-sunken">
            <img src={image ?? selectedPlace.image} alt="" className="h-full w-full object-cover" />
            <span className="badge absolute left-3 top-3 bg-surface/95 shadow-card">
              <CategoryIcon category={selectedPlace.category} size={13} />
              {categoryMap[selectedPlace.category].shortLabel}
            </span>
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
              icon="image"
              loading={uploading}
              onClick={() => fileRef.current?.click()}
              className="flex-1"
            >
              {uploading ? tr("Обработка…") : image ? tr("Заменить фото") : tr("Своё фото")}
            </Button>
            {image ? (
              <IconButton icon="trash" label={tr("Убрать своё фото")} variant="bordered" size="sm" onClick={() => setImage(null)} />
            ) : null}
          </div>
          <p className="flex items-start gap-2 text-meta leading-relaxed text-muted">
            <Icon name="info" size={14} className="mt-0.5 shrink-0" />
            {tr("Без фото возьмём изображение места. Иллюстративные кадры не выдаются за реальные фотографии заведения.")}
          </p>
        </div>

        <div className="space-y-4">
          <Field id="post-place" label={tr("Место")}>
            <Select id="post-place" value={placeId} onChange={(event) => setPlaceId(event.target.value)}>
              {places.map((place) => (
                <option key={place.id} value={place.id}>
                  {place.name} · {place.district}
                </option>
              ))}
            </Select>
          </Field>

          <Field id="post-title" label={tr("Заголовок")}>
            <Input
              id="post-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={80}
              placeholder={tr("Например: здесь лучший вечерний свет")}
            />
          </Field>

          <Field id="post-text" label={tr("Ваш совет")} hint={`${text.length}/800 · ${tr("Личный опыт важнее рекламы")}`}>
            <Textarea
              id="post-text"
              value={text}
              onChange={(event) => setText(event.target.value)}
              maxLength={800}
              rows={5}
              placeholder={tr("Что здесь стоит увидеть, попробовать или почувствовать? Без выдуманных фактов — только личный опыт.")}
            />
          </Field>

          <p className="flex items-center gap-2 rounded-xl bg-sunken px-3.5 py-3 text-meta leading-relaxed text-muted">
            <Icon name="info" size={14} className="shrink-0" />
            {tr("Категория определится автоматически")}: {categoryMap[selectedPlace.category].label}.
          </p>
        </div>
      </div>
    </Modal>
  );
}
