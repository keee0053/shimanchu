import { ISLAND_TYPES, type IslandType, type UserPresence } from '@/domain/entities/island';
import type { PresenceRepository } from '@/domain/repositories/presence-repository';

import { supabase } from './client';
import type { Tables } from './database.types';

const USER_PRESENCE_COLUMNS = 'user_id, island_type, status_text, updated_at';

function toIslandType(value: string): IslandType {
  return (ISLAND_TYPES as readonly string[]).includes(value) ? (value as IslandType) : 'drifting';
}

function toUserPresence(row: Tables<'user_presence'>): UserPresence {
  return {
    userId: row.user_id,
    islandType: toIslandType(row.island_type),
    statusText: row.status_text,
    updatedAt: row.updated_at,
  };
}

async function getCurrentUserId(): Promise<string | null> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error) {
    throw error;
  }
  return session?.user?.id ?? null;
}

export const supabasePresenceRepository: PresenceRepository = {
  async findMyPresence(): Promise<UserPresence | null> {
    const userId = await getCurrentUserId();
    if (!userId) {
      return null;
    }

    const { data, error } = await supabase
      .from('user_presence')
      .select(USER_PRESENCE_COLUMNS)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data ? toUserPresence(data) : null;
  },

  async saveMyIsland(islandType: IslandType): Promise<UserPresence | null> {
    const userId = await getCurrentUserId();
    if (!userId) {
      return null;
    }

    const { data, error } = await supabase
      .from('user_presence')
      .upsert(
        {
          user_id: userId,
          island_type: islandType,
        },
        { onConflict: 'user_id' },
      )
      .select(USER_PRESENCE_COLUMNS)
      .single();

    if (error) {
      throw error;
    }

    return toUserPresence(data);
  },
};
