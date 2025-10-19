export const endpoints = {
  // === BOARD CARDS ===
  cards: {
    list: "/api/board/cards", // GET
    create: "/api/board/cards", // POST
    update: (id: string) => `/api/board/cards/${encodeURIComponent(id)}`, // PATCH
    remove: (id: string) => `/api/board/cards/${encodeURIComponent(id)}`, // DELETE
    move: (id: string) => `/api/board/cards/${encodeURIComponent(id)}/move`, // POST
    reorder: "/api/board/cards/reorder", // POST
  },

  // === NOTES ===
  notes: {
    list: "/api/notes", // GET
    create: "/api/notes", // POST
    update: (id: string) => `/api/notes/${encodeURIComponent(id)}`, // PUT
    remove: (id: string) => `/api/notes/${encodeURIComponent(id)}`, // DELETE
  },

  // === ADMIN ===
  admin: {
    secret: "/api/admin/secret", // GET

    // Users
    users: (q?: string, page = 0, pageSize = 25) =>
      `/api/admin/users?q=${encodeURIComponent(q ?? "")}&page=${page}&pageSize=${pageSize}`, // GET

    blockUser: (userId: string) =>
      `/api/admin/users/${encodeURIComponent(userId)}/block`, // POST { block:boolean }

    resetPassword: (userId: string, resultUrl?: string) =>
      `/api/admin/users/${encodeURIComponent(userId)}/reset-password${
        resultUrl ? `?resultUrl=${encodeURIComponent(resultUrl)}` : ""
      }`, // POST -> { ticketUrl }

    // Roles / permissions
    roles: "/api/admin/roles", // GET
    rolePermissions: (roleId: string) =>
      `/api/admin/roles/${encodeURIComponent(roleId)}/permissions`, // GET

    // User roles
    userRoles: (userId: string) =>
      `/api/admin/users/${encodeURIComponent(userId)}/roles`, // GET
    assignRoles: (userId: string) =>
      `/api/admin/users/${encodeURIComponent(userId)}/roles`, // POST { roleIds: string[] }
    removeRole: (userId: string, roleId: string) =>
      `/api/admin/users/${encodeURIComponent(userId)}/roles/${encodeURIComponent(roleId)}`, // DELETE
  },

  // === PROFILE ===
  profile: {
    me: "/api/profile", // GET
  },
} as const;
