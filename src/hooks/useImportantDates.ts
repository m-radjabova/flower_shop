import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createMyImportantDate,
  deleteMyImportantDate,
  getMyImportantDates,
  updateMyImportantDate,
} from "../api/auth";
import type {
  ImportantDateCreatePayload,
  ImportantDateUpdatePayload,
} from "../types/types";

export const importantDatesQueryKey = ["important-dates", "me"];

type QueryToggleOptions = {
  enabled?: boolean;
};

export function useMyImportantDates(options?: QueryToggleOptions) {
  return useQuery({
    queryKey: importantDatesQueryKey,
    queryFn: getMyImportantDates,
    enabled: options?.enabled ?? true,
  });
}

export function useCreateImportantDate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ImportantDateCreatePayload) => createMyImportantDate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: importantDatesQueryKey });
    },
  });
}

export function useUpdateImportantDate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ importantDateId, payload }: { importantDateId: string; payload: ImportantDateUpdatePayload }) =>
      updateMyImportantDate(importantDateId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: importantDatesQueryKey });
    },
  });
}

export function useDeleteImportantDate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (importantDateId: string) => deleteMyImportantDate(importantDateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: importantDatesQueryKey });
    },
  });
}
