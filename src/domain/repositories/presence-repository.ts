import type { IslandType, UserPresence } from '../entities/island';

export type PresenceRepository = {
  findMyPresence(): Promise<UserPresence | null>;
  saveMyIsland(islandType: IslandType): Promise<UserPresence | null>;
};
