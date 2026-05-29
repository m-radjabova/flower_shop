import useContextPro from "../../../hooks/useContextPro";
import { useAdminCategories, useAdminUsers } from "../../../hooks/useAdmin";
import { useAdminShops } from "../../../hooks/useCatalog";

export function useAdmin() {
  const {
    state: { user },
  } = useContextPro();

  const adminUsersQuery = useAdminUsers({ limit: 100, offset: 0 });
  const adminShopsQuery = useAdminShops();
  const adminCategoriesQuery = useAdminCategories();

  return {
    user,
    adminUsersQuery,
    adminShopsQuery,
    adminCategoriesQuery,
  };
}
