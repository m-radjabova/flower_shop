import { useCallback, useEffect, useMemo, useReducer, useRef, type Dispatch, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { clearStoredAuth, getMe, logoutUser, normalizeUser, persistTokens } from "../api/auth";
import { getStoredAccessToken, setStoredCurrentUserId } from "../api/authStorage";
import { MyContext } from "../context/MyContext";
import type { LoginResponse, User } from "../types/types";
import { useOrderRealtime } from "./useOrderRealtime";

export interface TypeState {
  user: User | null;
  isLoading: boolean;
}

export interface ContextType {
  state: TypeState;
  dispatch: Dispatch<Action>;
  login: (tokens: LoginResponse, user: User) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

type SetUserAction = { type: "SET_USER"; payload: User | null };
type UpdateUserAction = { type: "UPDATE_USER"; payload: Partial<User> };
type LogoutAction = { type: "LOGOUT" };
type SetLoadingAction = { type: "SET_LOADING"; payload: boolean };

type Action = SetUserAction | UpdateUserAction | LogoutAction | SetLoadingAction;

function isAuthScopedQuery(queryKey: readonly unknown[]) {
  const [scope, subScope] = queryKey;

  if (scope === "orders") return true;
  if (scope === "addresses") return true;
  if (scope === "referrals") return true;
  if (scope === "important-dates") return true;
  if (scope === "support-chats") return true;

  if (scope === "bouquets") return subScope === "manage";
  if (scope === "reviews") return subScope === "me" || subScope === "manage";
  if (scope === "shops") return subScope === "me" || subScope === "admin";
  if (scope === "shop-applications") return subScope === "me" || subScope === "admin";
  if (scope === "users") return subScope === "admin";

  return false;
}

function reducer(state: TypeState, action: Action): TypeState {
  switch (action.type) {
    case "SET_USER":
      return { ...state, user: action.payload };
    case "UPDATE_USER":
      return state.user ? { ...state, user: { ...state.user, ...action.payload } } : state;
    case "LOGOUT":
      return { ...state, user: null };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

function CreateContextPro({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const authRequestIdRef = useRef(0);
  const [state, dispatch] = useReducer(reducer, {
    user: null,
    isLoading: true,
  });

  useOrderRealtime({
    scope: state.user?.role === "admin" ? "admin" : "me",
    enabled: Boolean(state.user),
    onEvent: ({ event, order }) => {
      if (event === "order.created") {
        toast.info(`Buyurtma keldi: #${order.id.slice(0, 8)}`);
        return;
      }

      toast.success(`Buyurtma yangilandi: #${order.id.slice(0, 8)}`);
    },
  });

  const refreshUser = useCallback(async () => {
    const requestId = ++authRequestIdRef.current;

    if (!getStoredAccessToken()) {
      queryClient.removeQueries({ predicate: ({ queryKey }) => isAuthScopedQuery(queryKey) });
      setStoredCurrentUserId(null);
      if (requestId === authRequestIdRef.current) {
        dispatch({ type: "SET_USER", payload: null });
        dispatch({ type: "SET_LOADING", payload: false });
      }
      return;
    }

    dispatch({ type: "SET_LOADING", payload: true });

    try {
      const me = await getMe();
      const normalized = normalizeUser(me);
      setStoredCurrentUserId(normalized.id);
      if (requestId === authRequestIdRef.current) {
        dispatch({ type: "SET_USER", payload: normalized });
      }
    } catch {
      if (requestId === authRequestIdRef.current) {
        clearStoredAuth();
        setStoredCurrentUserId(null);
        queryClient.removeQueries({ predicate: ({ queryKey }) => isAuthScopedQuery(queryKey) });
        dispatch({ type: "SET_USER", payload: null });
      }
    } finally {
      if (requestId === authRequestIdRef.current) {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    }
  }, [queryClient]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback((tokens: LoginResponse, user: User) => {
    authRequestIdRef.current += 1;
    const normalized = normalizeUser(user);
    persistTokens(tokens);
    setStoredCurrentUserId(normalized.id);
    queryClient.removeQueries({ predicate: ({ queryKey }) => isAuthScopedQuery(queryKey) });
    dispatch({ type: "SET_USER", payload: normalized });
    dispatch({ type: "SET_LOADING", payload: false });
  }, [queryClient]);

  const logout = useCallback(async () => {
    authRequestIdRef.current += 1;

    try {
      await logoutUser();
    } catch {
      // local logout still completes
    } finally {
      setStoredCurrentUserId(null);
      clearStoredAuth();
      queryClient.removeQueries({ predicate: ({ queryKey }) => isAuthScopedQuery(queryKey) });
      dispatch({ type: "LOGOUT" });
      navigate("/login", { replace: true });
    }
  }, [navigate, queryClient]);

  const value = useMemo<ContextType>(
    () => ({
      state,
      dispatch,
      login,
      logout,
      refreshUser,
    }),
    [state, login, logout, refreshUser],
  );

  return <MyContext.Provider value={value}>{children}</MyContext.Provider>;
}

export default CreateContextPro;
