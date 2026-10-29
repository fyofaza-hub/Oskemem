import { AnimatePresence, motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/context/ToastContext";
import { pluralizePlaces } from "@/lib/utils";
import { tr } from "@/i18n/runtime";
import { Button, IconButton } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export function DraftBar() {
  const { draft, clearDraft, currentUser } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const hidden =
    !currentUser ||
    !draft ||
    draft.stops.length === 0 ||
    location.pathname === "/routes/new" ||
    location.pathname === "/auth";

  return (
    <AnimatePresence>
      {!hidden ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none fixed inset-x-0 bottom-20 z-40 flex justify-center px-4 lg:bottom-6 lg:left-60"
        >
          <div className="pointer-events-auto flex w-full max-w-xl items-center gap-3 rounded-2xl border border-line bg-surface p-3 pl-4 shadow-raised">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-ink">
              <Icon name="routes" size={17} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-fg">{draft.title.trim() || tr("Черновик маршрута")}</p>
              <p className="truncate text-meta text-muted">
                {pluralizePlaces(draft.stops.length)} · {tr("сохранено в браузере")}
              </p>
            </div>
            <Button variant="primary" size="sm" onClick={() => navigate("/routes/new")}>
              {tr("Открыть")}
            </Button>
            <IconButton
              icon="close"
              label={tr("Очистить черновик")}
              size="sm"
              onClick={() => {
                clearDraft();
                toast({ title: tr("Черновик очищен"), variant: "info" });
              }}
            />
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
