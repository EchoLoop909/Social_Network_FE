// Tiện ích đọc ROLE (RBAC) từ access_token do Keycloak cấp.
// Role nằm trong claim realm_access.roles (realm role) và/hoặc resource_access.<client>.roles (client role).

export function decodeToken(accessToken) {
  try {
    return JSON.parse(atob(accessToken.split(".")[1]));
  } catch {
    return null;
  }
}

/** Trả về mảng role (gộp realm role + mọi client role), không trùng. */
export function getRolesFromToken(accessToken) {
  const p = decodeToken(accessToken);
  if (!p) return [];
  const realm = (p.realm_access && p.realm_access.roles) || [];
  const client = Object.values(p.resource_access || {}).flatMap((r) => (r && r.roles) || []);
  return Array.from(new Set([...realm, ...client]));
}

/** Token có role ADMIN không (không phân biệt hoa/thường). */
export function isAdminToken(accessToken) {
  if (!accessToken) return false;
  return getRolesFromToken(accessToken).some((r) => String(r).toUpperCase() === "ADMIN");
}
