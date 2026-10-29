import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/context/ToastContext";
import { tr } from "@/i18n/runtime";

export function useRequireAuth() {
  const { currentUser } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  return useCallback(
    (action?: () => void, message = tr("Войдите, чтобы сохранять и создавать")) => {
      if (!currentUser) {
        toast({
          title: message,
          description: tr("Вход занимает пару секунд."),
          variant: "info",
        });
        navigate("/auth", { state: { from: `${location.pathname}${location.search}` } });
        return false;
      }
      action?.();
      return true;
    },
    [currentUser, location.pathname, location.search, navigate, toast],
  );
}
