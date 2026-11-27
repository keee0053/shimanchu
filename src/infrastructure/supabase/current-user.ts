import { supabase } from './client';

/** ログイン中のユーザーの ID。ログインしていなければ、`action` を添えたエラーにする */
export async function requireCurrentUserId(action: string): Promise<string> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!data.session) {
    throw new Error(`${action}にはログインが必要です。`);
  }
  return data.session.user.id;
}
