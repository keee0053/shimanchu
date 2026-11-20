import * as Crypto from 'expo-crypto';
import { File } from 'expo-file-system';
import { Platform } from 'react-native';

import { PROFILE_IMAGE_BUCKET } from '@/domain/entities/profile-image';
import type {
  ProfileImageStorageRepository,
  UploadProfileImageInput,
} from '@/domain/repositories/profile-image-repository';
import {
  buildProfileImagePath,
  isAllowedProfileImageMimeType,
  isValidProfileImagePath,
  isValidProfileImageSize,
} from '@/domain/services/profile-image';

import { supabase } from './client';

const PROFILE_IMAGE_SIGNED_URL_EXPIRES_IN_SECONDS = 60 * 60;
const STORAGE_LIST_PAGE_SIZE = 100;

async function requireCurrentUserId(): Promise<string> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error) {
    throw error;
  }
  if (!session?.user?.id) {
    throw new Error('プロフィール画像を操作するにはログインが必要です。');
  }
  return session.user.id;
}

async function readFileAsArrayBuffer(uri: string): Promise<ArrayBuffer> {
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    return await response.arrayBuffer();
  }
  const file = new File(uri);
  return await file.arrayBuffer();
}

export const supabaseProfileImageRepository: ProfileImageStorageRepository = {
  async uploadMyProfileImage(input: UploadProfileImageInput): Promise<string> {
    const userId = await requireCurrentUserId();

    if (!isAllowedProfileImageMimeType(input.mimeType)) {
      throw new Error('対応していない画像形式です（JPEG・PNG・WebP のみ対応）。');
    }
    if (!isValidProfileImageSize(input.sizeBytes)) {
      throw new Error('画像サイズが上限（2MB）を超えています。');
    }

    const arrayBuffer = await readFileAsArrayBuffer(input.uri);
    if (!isValidProfileImageSize(arrayBuffer.byteLength)) {
      throw new Error('画像サイズが上限（2MB）を超えているか、ファイルが空です。');
    }

    const filePath = buildProfileImagePath(userId, Crypto.randomUUID(), input.mimeType);
    const { data, error } = await supabase.storage
      .from(PROFILE_IMAGE_BUCKET)
      .upload(filePath, arrayBuffer, {
        contentType: input.mimeType,
        upsert: false,
      });

    if (error) {
      throw error;
    }

    return data.path;
  },

  async updateMyProfileImagePath(imagePath: string | null): Promise<void> {
    const userId = await requireCurrentUserId();

    if (imagePath !== null && !isValidProfileImagePath(imagePath, userId)) {
      throw new Error('プロフィール画像の保存先パスが不正です。');
    }

    const { error } = await supabase
      .from('profiles')
      .update({ image_path: imagePath })
      .eq('id', userId);

    if (error) {
      throw error;
    }
  },

  async getSignedProfileImageUrl(imagePath: string): Promise<string> {
    if (!imagePath) {
      throw new Error('プロフィール画像のパスが指定されていません。');
    }

    const { data, error } = await supabase.storage
      .from(PROFILE_IMAGE_BUCKET)
      .createSignedUrl(imagePath, PROFILE_IMAGE_SIGNED_URL_EXPIRES_IN_SECONDS);

    if (error) {
      throw error;
    }
    if (!data?.signedUrl) {
      throw new Error('プロフィール画像の署名付き URL を取得できませんでした。');
    }

    return data.signedUrl;
  },

  async deleteProfileImage(imagePath: string): Promise<void> {
    if (!imagePath) {
      return;
    }

    const { error } = await supabase.storage.from(PROFILE_IMAGE_BUCKET).remove([imagePath]);
    if (error) {
      throw error;
    }
  },

  async deleteAllMyProfileImages(): Promise<void> {
    const userId = await requireCurrentUserId();
    const allPaths: string[] = [];
    let offset = 0;

    while (true) {
      const { data, error } = await supabase.storage.from(PROFILE_IMAGE_BUCKET).list(userId, {
        limit: STORAGE_LIST_PAGE_SIZE,
        offset,
      });
      if (error) {
        throw error;
      }
      if (!data || data.length === 0) {
        break;
      }

      for (const item of data) {
        if (item.id !== null) {
          allPaths.push(`${userId}/${item.name}`);
        }
      }

      if (data.length < STORAGE_LIST_PAGE_SIZE) {
        break;
      }
      offset += data.length;
    }

    for (let i = 0; i < allPaths.length; i += STORAGE_LIST_PAGE_SIZE) {
      const batch = allPaths.slice(i, i + STORAGE_LIST_PAGE_SIZE);
      const { error } = await supabase.storage.from(PROFILE_IMAGE_BUCKET).remove(batch);
      if (error) {
        throw error;
      }
    }
  },
};
