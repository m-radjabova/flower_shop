import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getUsers,
  updateUser,
  type AdminUserUpdatePayload,
  type GetUsersParams,
} from "../api/auth";
import {
  createCategory,
  getAdminCategories,
  updateCategory,
  type CategoryCreatePayload,
  type CategoryUpdatePayload,
} from "../api/catalog";

export function useAdminUsers(params: GetUsersParams = {}) {
  return useQuery({
    queryKey: ["users", "admin", params],
    queryFn: () => getUsers(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useUpdateAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: AdminUserUpdatePayload }) =>
      updateUser(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users", "admin"] });
    },
  });
}

export function useAdminCategories() {
  return useQuery({
    queryKey: ["categories", "admin"],
    queryFn: getAdminCategories,
  });
}

export function useCreateAdminCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CategoryCreatePayload) => createCategory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories", "admin"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useUpdateAdminCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ categoryId, payload }: { categoryId: string; payload: CategoryUpdatePayload }) =>
      updateCategory(categoryId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories", "admin"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}
