import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

import type {
  PickedProfileImage,
  PreparedProfileImage,
  ProfileImageCropRect,
} from '@/domain/entities/profile-image';
import type { ProfileImagePickerRepository } from '@/domain/repositories/profile-image-repository';
import {
  calculateProfileImageResize,
  isValidProfileImageSize,
} from '@/domain/services/profile-image';

const COMPRESSION_QUALITIES = [0.8, 0.6, 0.4] as const;
const NORMALIZED_SOURCE_MAX_DIMENSION = 2048;

async function getFileSizeBytes(uri: string): Promise<number> {
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    const buffer = await response.arrayBuffer();
    return buffer.byteLength;
  }
  const file = new File(uri);
  return file.size;
}

export const expoProfileImagePickerRepository: ProfileImagePickerRepository = {
  async pickProfileImage(): Promise<PickedProfileImage | null> {
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });

    if (pickerResult.canceled || !pickerResult.assets[0]) {
      return null;
    }

    const asset = pickerResult.assets[0];
    // EXIF の向きを正立化し、過大な元画像を一定サイズ以内に収めてプレビュー座標と切り抜き座標を一致させる
    const context = ImageManipulator.manipulate(asset.uri, {
      maxWidth: NORMALIZED_SOURCE_MAX_DIMENSION,
      maxHeight: NORMALIZED_SOURCE_MAX_DIMENSION,
    });
    let rendered: Awaited<ReturnType<typeof context.renderAsync>> | null = null;

    try {
      if (Platform.OS === 'web') {
        const fallbackResize = calculateProfileImageResize(
          asset.width,
          asset.height,
          NORMALIZED_SOURCE_MAX_DIMENSION,
        );
        if (fallbackResize) {
          context.resize(fallbackResize);
        }
      }
      rendered = await context.renderAsync();
      const normalized = await rendered.saveAsync({
        format: SaveFormat.JPEG,
        compress: 0.95,
      });
      return {
        uri: normalized.uri,
        width: normalized.width,
        height: normalized.height,
      };
    } finally {
      rendered?.release();
      context.release();
    }
  },

  async cropAndPrepareProfileImage(
    source: PickedProfileImage,
    cropRect: ProfileImageCropRect,
  ): Promise<PreparedProfileImage> {
    const context = ImageManipulator.manipulate(source.uri);
    let rendered: Awaited<ReturnType<typeof context.renderAsync>> | null = null;

    try {
      context.crop(cropRect);
      const resizeSpec = calculateProfileImageResize(cropRect.width, cropRect.height);
      if (resizeSpec) {
        context.resize(resizeSpec);
      }
      rendered = await context.renderAsync();

      for (const compress of COMPRESSION_QUALITIES) {
        const saved = await rendered.saveAsync({
          format: SaveFormat.JPEG,
          compress,
        });

        const sizeBytes = await getFileSizeBytes(saved.uri);
        if (isValidProfileImageSize(sizeBytes)) {
          return {
            uri: saved.uri,
            mimeType: 'image/jpeg',
            sizeBytes,
            width: saved.width,
            height: saved.height,
          };
        }
      }
    } finally {
      rendered?.release();
      context.release();
    }

    throw new Error('画像を 2MB 以下に圧縮できませんでした。別の画像を選択してください。');
  },
};
