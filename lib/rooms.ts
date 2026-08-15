import type { Room } from "@/types/room";

const STORAGE_KEY = "otherroom_rooms";

function getRooms(): Room[] {
  if (typeof window === "undefined") {
    return [];
  }

  const storedRooms = localStorage.getItem(STORAGE_KEY);

  if (!storedRooms) {
    return [];
  }

  try {
    return JSON.parse(storedRooms) as Room[];
  } catch {
    return [];
  }
}

export function createRoom(
  room: Omit<Room, "id" | "createdAt">
): Room {
  const newRoom: Room = {
    ...room,
    id: crypto.randomUUID().split("-")[0],
    createdAt: new Date().toISOString(),
  };

  const rooms = getRooms();

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([...rooms, newRoom])
  );

  return newRoom;
}

export function getRoom(roomId: string): Room | null {
  const rooms = getRooms();

  return rooms.find((room) => room.id === roomId) ?? null;
}
