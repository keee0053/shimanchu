import { Image } from 'expo-image';
import React, { useState } from 'react';
import {
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Mask, Rect } from 'react-native-svg';

import {
  type PickedProfileImage,
  PROFILE_IMAGE_MAX_CROP_SCALE,
  type ProfileImageCropRect,
} from '@/domain/entities/profile-image';
import {
  calculateProfileImageCropRect,
  clampProfileImageCropTransform,
} from '@/domain/services/profile-image';
import { ThemedText } from '@/presentation/components/themed-text';
import { Spacing } from '@/presentation/constants/theme';

type ProfileImageCropModalProps = {
  image: PickedProfileImage | null;
  isSubmitting: boolean;
  onCancel: () => void;
  onComplete: (cropRect: ProfileImageCropRect) => void;
};

type TouchPoint = { pageX: number; pageY: number };

function getTouchDistance(a: TouchPoint, b: TouchPoint): number {
  return Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
}

type CropEditorProps = {
  image: PickedProfileImage;
  isSubmitting: boolean;
  onCancel: () => void;
  onComplete: (cropRect: ProfileImageCropRect) => void;
};

function CropEditor({ image, isSubmitting, onCancel, onComplete }: CropEditorProps) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const viewportSize = Math.min(Math.max(220, windowWidth - 48), 320);

  const [transform, setTransform] = useState({ scale: 1, translateX: 0, translateY: 0 });

  const [panResponder] = useState(() => {
    const gesture = {
      mode: 'none' as 'none' | 'pan' | 'pinch',
      baseScale: 1,
      baseX: 0,
      baseY: 0,
      panOffsetDx: 0,
      panOffsetDy: 0,
      initialPinchDistance: 0,
    };

    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const touches = evt.nativeEvent.touches;
        setTransform((prev) => {
          gesture.baseScale = prev.scale;
          gesture.baseX = prev.translateX;
          gesture.baseY = prev.translateY;
          gesture.panOffsetDx = 0;
          gesture.panOffsetDy = 0;
          if (touches.length >= 2) {
            gesture.mode = 'pinch';
            gesture.initialPinchDistance = Math.max(1, getTouchDistance(touches[0], touches[1]));
          } else {
            gesture.mode = 'pan';
            gesture.initialPinchDistance = 0;
          }
          return prev;
        });
      },
      onPanResponderMove: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches;
        if (touches.length >= 2) {
          const distance = Math.max(1, getTouchDistance(touches[0], touches[1]));
          setTransform((prev) => {
            if (gesture.mode !== 'pinch') {
              gesture.mode = 'pinch';
              gesture.baseScale = prev.scale;
              gesture.baseX = prev.translateX;
              gesture.baseY = prev.translateY;
              gesture.initialPinchDistance = distance;
              return prev;
            }
            const nextScale = gesture.baseScale * (distance / gesture.initialPinchDistance);
            const clamped = clampProfileImageCropTransform({
              imageWidth: image.width,
              imageHeight: image.height,
              viewportSize,
              scale: nextScale,
              translateX: prev.translateX,
              translateY: prev.translateY,
            });
            return {
              scale: clamped.scale,
              translateX: clamped.translateX,
              translateY: clamped.translateY,
            };
          });
          return;
        }

        setTransform((prev) => {
          if (gesture.mode !== 'pan') {
            gesture.mode = 'pan';
            gesture.baseScale = prev.scale;
            gesture.baseX = prev.translateX;
            gesture.baseY = prev.translateY;
            gesture.panOffsetDx = gestureState.dx;
            gesture.panOffsetDy = gestureState.dy;
            return prev;
          }
          const deltaX = gestureState.dx - gesture.panOffsetDx;
          const deltaY = gestureState.dy - gesture.panOffsetDy;
          const clamped = clampProfileImageCropTransform({
            imageWidth: image.width,
            imageHeight: image.height,
            viewportSize,
            scale: prev.scale,
            translateX: gesture.baseX + deltaX,
            translateY: gesture.baseY + deltaY,
          });
          return {
            scale: clamped.scale,
            translateX: clamped.translateX,
            translateY: clamped.translateY,
          };
        });
      },
      onPanResponderRelease: () => {
        gesture.mode = 'none';
      },
      onPanResponderTerminate: () => {
        gesture.mode = 'none';
      },
    });
  });

  const applyZoom = (nextScale: number, resetPosition: boolean = false) => {
    setTransform((prev) => {
      const clamped = clampProfileImageCropTransform({
        imageWidth: image.width,
        imageHeight: image.height,
        viewportSize,
        scale: nextScale,
        translateX: resetPosition ? 0 : prev.translateX,
        translateY: resetPosition ? 0 : prev.translateY,
      });
      return {
        scale: clamped.scale,
        translateX: clamped.translateX,
        translateY: clamped.translateY,
      };
    });
  };

  const clampedDisplay = clampProfileImageCropTransform({
    imageWidth: image.width,
    imageHeight: image.height,
    viewportSize,
    scale: transform.scale,
    translateX: transform.translateX,
    translateY: transform.translateY,
  });

  const handleConfirm = () => {
    if (isSubmitting) {
      return;
    }
    const cropRect = calculateProfileImageCropRect({
      imageWidth: image.width,
      imageHeight: image.height,
      viewportSize,
      scale: transform.scale,
      translateX: transform.translateX,
      translateY: transform.translateY,
    });
    onComplete(cropRect);
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, Spacing.three) }]}>
        <Pressable
          accessibilityRole="button"
          disabled={isSubmitting}
          onPress={onCancel}
          style={({ pressed }) => [
            styles.headerButton,
            isSubmitting && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <ThemedText type="smallBold" style={styles.cancelText}>
            キャンセル
          </ThemedText>
        </Pressable>

        <ThemedText type="smallBold" style={styles.headerTitle}>
          画像を調整
        </ThemedText>

        <Pressable
          accessibilityRole="button"
          disabled={isSubmitting}
          onPress={handleConfirm}
          style={({ pressed }) => [
            styles.completeButton,
            isSubmitting && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <ThemedText type="smallBold" style={styles.completeText}>
            {isSubmitting ? '処理中...' : '完了'}
          </ThemedText>
        </Pressable>
      </View>

      <View style={styles.stage} pointerEvents={isSubmitting ? 'none' : 'auto'}>
        <View
          style={[styles.viewportFrame, { width: viewportSize, height: viewportSize }]}
          {...panResponder.panHandlers}
        >
          <Image
            source={{ uri: image.uri }}
            contentFit="fill"
            style={{
              width: clampedDisplay.displayedWidth,
              height: clampedDisplay.displayedHeight,
              transform: [
                { translateX: clampedDisplay.translateX },
                { translateY: clampedDisplay.translateY },
              ],
            }}
          />
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <Svg width={viewportSize} height={viewportSize}>
              <Defs>
                <Mask id="profile-crop-mask">
                  <Rect width={viewportSize} height={viewportSize} fill="white" />
                  <Circle
                    cx={viewportSize / 2}
                    cy={viewportSize / 2}
                    r={viewportSize / 2 - 1}
                    fill="black"
                  />
                </Mask>
              </Defs>
              <Rect
                width={viewportSize}
                height={viewportSize}
                fill="rgba(0, 0, 0, 0.55)"
                mask="url(#profile-crop-mask)"
              />
              <Circle
                cx={viewportSize / 2}
                cy={viewportSize / 2}
                r={viewportSize / 2 - 1}
                stroke="rgba(255, 255, 255, 0.85)"
                strokeWidth={1.5}
                fill="none"
              />
            </Svg>
          </View>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Spacing.four) }]}>
        <ThemedText type="small" style={styles.hintText}>
          ドラッグで位置・ピンチまたはボタンで拡大を調整できます
        </ThemedText>
        <View style={styles.zoomControls}>
          <Pressable
            accessibilityRole="button"
            disabled={isSubmitting || transform.scale <= 1}
            onPress={() => applyZoom(transform.scale - 0.5)}
            style={({ pressed }) => [
              styles.zoomButton,
              (isSubmitting || transform.scale <= 1) && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            <ThemedText type="smallBold" style={styles.zoomButtonText}>
              縮小
            </ThemedText>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={() => applyZoom(1, true)}
            style={({ pressed }) => [
              styles.zoomButton,
              isSubmitting && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            <ThemedText type="smallBold" style={styles.zoomButtonText}>
              リセット
            </ThemedText>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={isSubmitting || transform.scale >= PROFILE_IMAGE_MAX_CROP_SCALE}
            onPress={() => applyZoom(transform.scale + 0.5)}
            style={({ pressed }) => [
              styles.zoomButton,
              (isSubmitting || transform.scale >= PROFILE_IMAGE_MAX_CROP_SCALE) && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            <ThemedText type="smallBold" style={styles.zoomButtonText}>
              拡大
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

/**
 * 選択したプロフィール画像を丸型アイコンに合わせてドラッグ・拡大縮小し、「完了」で確定するモーダル
 */
export function ProfileImageCropModal({
  image,
  isSubmitting,
  onCancel,
  onComplete,
}: ProfileImageCropModalProps) {
  return (
    <Modal
      visible={Boolean(image)}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => {
        if (!isSubmitting) {
          onCancel();
        }
      }}
    >
      {image ? (
        <CropEditor
          key={image.uri}
          image={image}
          isSubmitting={isSubmitting}
          onCancel={onCancel}
          onComplete={onComplete}
        />
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
  },
  headerButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  cancelText: {
    color: '#E2E8F0',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  // TODO(#14): テーマカラーの整備にあわせてモーダル配色を共通テーマに統一する
  completeButton: {
    backgroundColor: '#0284C7',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  completeText: {
    color: '#FFFFFF',
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewportFrame: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#020617',
    borderRadius: 8,
  },
  footer: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    gap: Spacing.two,
    alignItems: 'center',
  },
  hintText: {
    color: '#CBD5E1',
    textAlign: 'center',
  },
  zoomControls: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  zoomButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  zoomButtonText: {
    color: '#FFFFFF',
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.75,
  },
});
