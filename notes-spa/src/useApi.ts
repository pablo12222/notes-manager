import { useAuth0 } from "@auth0/auth0-react";
import { useMemo } from "react";
import { createAuthedFetch } from "./api";
import { endpoints } from "./endpoints";

export type BoardColumn = "Backlog" | "Doing" | "Done";

export interface BoardCard {
  id: string;
  text: string;
  color: string;
  column: BoardColumn;
  order: number;
  createdAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  status?: "todo" | "doing" | "done";
  createdAt?: string;
}

export type UserSummaryDto = {
  id: string;
  email?: string | null;
  blocked: boolean;
  roles: string[];
};
export type UsersPage = { total: number; items: UserSummaryDto[] };
export type RoleDto = { id: string; name: string; description?: string | null };

const columnToEnum: Record<BoardColumn, number> = { Backlog: 0, Doing: 1, Done: 2 };

export function useApi() {
  const { getAccessTokenSilently } = useAuth0();
  const authedFetch = useMemo(
    () => createAuthedFetch(getAccessTokenSilently),
    [getAccessTokenSilently]
  );

  // === CARDS ===
  const getCards = async (): Promise<BoardCard[]> => {
    const res = await authedFetch(endpoints.cards.list, { method: "GET" });
    return res.json();
  };

  const addCard = async (card: {
    text: string;
    color: string;
    column: BoardColumn;
  }): Promise<BoardCard> => {
    const res = await authedFetch(endpoints.cards.create, {
      method: "POST",
      body: JSON.stringify({
        text: card.text,
        color: card.color,
        column: columnToEnum[card.column],
      }),
    });
    return res.json();
  };

  const updateCard = async (
    id: string,
    card: { text: string; color: string }
  ): Promise<BoardCard> => {
    const res = await authedFetch(endpoints.cards.update(id), {
      method: "PATCH",
      body: JSON.stringify(card),
    });
    return res.json();
  };

  const deleteCard = async (id: string): Promise<void> => {
    await authedFetch(endpoints.cards.remove(id), { method: "DELETE" });
  };

  const moveCard = async (id: string, targetColumn: BoardColumn): Promise<void> => {
    await authedFetch(endpoints.cards.move(id), {
      method: "POST",
      body: JSON.stringify({ targetColumn: columnToEnum[targetColumn] }),
    });
  };

  const reorderCards = async (column: BoardColumn, orderedIds: string[]): Promise<void> => {
    await authedFetch(endpoints.cards.reorder, {
      method: "POST",
      body: JSON.stringify({
        column: columnToEnum[column],
        orderedIds,
      }),
    });
  };

  // === NOTES ===
  const getNotes = async (): Promise<Note[]> => {
    const res = await authedFetch(endpoints.notes.list, { method: "GET" });
    return res.json();
  };

  const addNote = async (note: {
    title: string;
    content: string;
    status: NonNullable<Note["status"]>;
  }): Promise<Note> => {
    const res = await authedFetch(endpoints.notes.create, {
      method: "POST",
      body: JSON.stringify(note),
    });
    return res.json();
  };

  const updateNote = async (
    id: string,
    note: { title: string; content: string; status: NonNullable<Note["status"]> }
  ): Promise<void> => {
    await authedFetch(endpoints.notes.update(id), {
      method: "PUT",
      body: JSON.stringify(note),
    });
  };

  const deleteNote = async (id: string): Promise<void> => {
    await authedFetch(endpoints.notes.remove(id), { method: "DELETE" });
  };

  const getAdminSecret = async (signal?: AbortSignal): Promise<any> => {
    const res = await authedFetch(endpoints.admin.secret, { method: "GET", signal });
    return res.json();
  };

  const getMe = async (): Promise<any> => {
    const res = await authedFetch(endpoints.profile.me, { method: "GET" });
    return res.json();
  };

  const getUsers = async (
    q: string | undefined,
    page: number,
    pageSize: number,
    signal?: AbortSignal
  ): Promise<UsersPage> => {
    const url = endpoints.admin.users(q, page, pageSize);
    const res = await authedFetch(url, { method: "GET", signal });
    return res.json();
  };

  const blockUser = async (userId: string, block: boolean): Promise<void> => {
    await authedFetch(endpoints.admin.blockUser(userId), {
      method: "POST",
      body: JSON.stringify({ block }),
    });
  };

  const resetPassword = async (
    userId: string,
    resultUrl?: string
  ): Promise<{ ticketUrl: string }> => {
    const res = await authedFetch(endpoints.admin.resetPassword(userId, resultUrl), {
      method: "POST",
    });
    return res.json();
  };

  const getRoles = async (signal?: AbortSignal): Promise<RoleDto[]> => {
    const res = await authedFetch(endpoints.admin.roles, { method: "GET", signal });
    return res.json();
  };

  const getRolePermissions = async (
    roleId: string,
    signal?: AbortSignal
  ): Promise<string[]> => {
    const res = await authedFetch(endpoints.admin.rolePermissions(roleId), {
      method: "GET",
      signal,
    });
    return res.json();
  };

  const getUserRoles = async (
    userId: string,
    signal?: AbortSignal
  ): Promise<Array<{ id: string; name: string }>> => {
    const res = await authedFetch(endpoints.admin.userRoles(userId), { method: "GET", signal });
    return res.json();
  };

  const assignRoles = async (userId: string, roleIds: string[]): Promise<void> => {
    await authedFetch(endpoints.admin.assignRoles(userId), {
      method: "POST",
      body: JSON.stringify({ roleIds }),
    });
  };

  const removeRole = async (userId: string, roleId: string): Promise<void> => {
    await authedFetch(endpoints.admin.removeRole(userId, roleId), { method: "DELETE" });
  };

  return useMemo(
    () => ({
      // Board:
      getCards,
      addCard,
      updateCard,
      deleteCard,
      moveCard,
      reorderCards,
      // Notes:
      getNotes,
      addNote,
      updateNote,
      deleteNote,

      getAdminSecret,
      getMe,

      getUsers,
      blockUser,
      resetPassword,
      getRoles,
      getRolePermissions,
      getUserRoles,
      assignRoles,
      removeRole,
    }),
    [authedFetch]
  );
}
