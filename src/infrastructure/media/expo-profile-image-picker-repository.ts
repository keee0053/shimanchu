import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

import type { PreparedProfileImage } from '@/domain/entities/profile-image';
import type { ProfileImagePickerRepository } from '@/domain/repositories/profile-image-repository';
import {
  calculateProfileImageResize,
  isValidProfileImageSize,
} from '@/domain/services/profile-image';

const COMPRESSION_QUALITIES = [0.8, 0.6, 0.4] as const;

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
  async pickAndPrepareProfileImage(): Promise<PreparedProfileImage | null> {
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (pickerResult.canceled || !pickerResult.assets[0]) {
      return null;
    }

    const asset = pickerResult.assets[0];
    const resizeSpec = calculateProfileImageResize(asset.width, asset.height);
    const context = ImageManipulator.manipulate(asset.uri);
    let rendered: Awaited<ReturnType<typeof context.renderAsync>> | null = null;

    try {
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
