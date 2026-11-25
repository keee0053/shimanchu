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
import Svg, { Circle, Defs, Line, Mask, Path, Rect } from 'react-native-svg';

import type {
  CropCorner,
  PickedProfileImage,
  ProfileImageCropRect,
  SquareCropBox,
} from '@/domain/entities/profile-image';
import {
  calculateFittedImageSize,
  convertSquareCropBoxToImageRect,
  createInitialSquareCropBox,
  moveSquareCropBox,
  resizeSquareCropBox,
} from '@/domain/services/profile-image';
import { ThemedText } from '@/presentation/components/themed-text';
import { Spacing } from '@/presentation/constants/theme';

const CORNER_HIT_RADIUS = 38;
const BOX_EDGE_SLOP = 12;
const STAGE_HIT_PADDING = 20;
const MIN_CROP_BOX_SIZE = 64;

type ProfileImageCropModalProps = {
  image: PickedProfileImage | null;
  isSubmitting: boolean;
  onCancel: () => void;
  onComplete: (cropRect: ProfileImageCropRect) => void;
};

function findNearestCorner(x: number, y: number, box: SquareCropBox): CropCorner | null {
  const corners: { corner: CropCorner; cx: number; cy: number }[] = [
    { corner: 'top-left', cx: box.x, cy: box.y },
    { corner: 'top-right', cx: box.x + box.size, cy: box.y },
    { corner: 'bottom-left', cx: box.x, cy: box.y + box.size },
    { corner: 'bottom-right', cx: box.x + box.size, cy: box.y + box.size },
  ];

  let nearest: CropCorner | null = null;
  let minDistance = CORNER_HIT_RADIUS;
  for (const item of corners) {
    const distance = Math.hypot(x - item.cx, y - item.cy);
    if (distance <= minDistance) {
      minDistance = distance;
      nearest = item.corner;
    }
  }
  return nearest;
}

function isInsideCropBox(x: number, y: number, box: SquareCropBox): boolean {
  return (
    x >= box.x - BOX_EDGE_SLOP &&
    x <= box.x + box.size + BOX_EDGE_SLOP &&
    y >= box.y - BOX_EDGE_SLOP &&
    y <= box.y + box.size + BOX_EDGE_SLOP
  );
}

type CropEditorProps = {
  image: PickedProfileImage;
  displayedWidth: number;
  displayedHeight: number;
  topInset: number;
  bottomInset: number;
  isSubmitting: boolean;
  onCancel: () => void;
  onComplete: (cropRect: ProfileImageCropRect) => void;
};

function CropEditor({
  image,
  displayedWidth,
  displayedHeight,
  topInset,
  bottomInset,
  isSubmitting,
  onCancel,
  onComplete,
}: CropEditorProps) {
  const [cropBox, setCropBox] = useState<SquareCropBox>(() =>
    createInitialSquareCropBox(displayedWidth, displayedHeight),
  );

  const [panResponder] = useState(() => {
    const gesture: {
      mode: 'none' | 'move' | CropCorner;
      startBox: SquareCropBox;
    } = {
      mode: 'none',
      startBox: createInitialSquareCropBox(displayedWidth, displayedHeight),
    };

    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const touchX = evt.nativeEvent.locationX - STAGE_HIT_PADDING;
        const touchY = evt.nativeEvent.locationY - STAGE_HIT_PADDING;
        setCropBox((prev) => {
          gesture.startBox = prev;
          const corner = findNearestCorner(touchX, touchY, prev);
          if (corner) {
            gesture.mode = corner;
          } else if (isInsideCropBox(touchX, touchY, prev)) {
            gesture.mode = 'move';
          } else {
            gesture.mode = 'none';
          }
          return prev;
        });
      },
      onPanResponderMove: (_evt, gestureState) => {
        const { dx, dy } = gestureState;
        if (gesture.mode === 'none') {
          return;
        }
        if (gesture.mode === 'move') {
          setCropBox(moveSquareCropBox(gesture.startBox, dx, dy, displayedWidth, displayedHeight));
          return;
        }
        setCropBox(
          resizeSquareCropBox(
            gesture.startBox,
            gesture.mode,
            dx,
            dy,
            displayedWidth,
            displayedHeight,
            MIN_CROP_BOX_SIZE,
          ),
        );
      },
      onPanResponderRelease: () => {
        gesture.mode = 'none';
      },
      onPanResponderTerminate: () => {
        gesture.mode = 'none';
      },
    });
  });

  const handleConfirm = () => {
    if (isSubmitting) {
      return;
    }
    const cropRect = convertSquareCropBoxToImageRect({
      box: cropBox,
      displayedWidth,
      displayedHeight,
      imageWidth: image.width,
      imageHeight: image.height,
    });
    onComplete(cropRect);
  };

  const handleArmLength = Math.min(20, cropBox.size / 3);
  const rightEdge = cropBox.x + cropBox.size;
  const bottomEdge = cropBox.y + cropBox.size;
  const cornerPath = [
    `M ${cropBox.x} ${cropBox.y + handleArmLength} L ${cropBox.x} ${cropBox.y} L ${cropBox.x + handleArmLength} ${cropBox.y}`,
    `M ${rightEdge - handleArmLength} ${cropBox.y} L ${rightEdge} ${cropBox.y} L ${rightEdge} ${cropBox.y + handleArmLength}`,
    `M ${cropBox.x} ${bottomEdge - handleArmLength} L ${cropBox.x} ${bottomEdge} L ${cropBox.x + handleArmLength} ${bottomEdge}`,
    `M ${rightEdge - handleArmLength} ${bottomEdge} L ${rightEdge} ${bottomEdge} L ${rightEdge} ${bottomEdge - handleArmLength}`,
  ].join(' ');

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: Math.max(topInset, Spacing.three) }]}>
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
          style={{
            width: displayedWidth + STAGE_HIT_PADDING * 2,
            height: displayedHeight + STAGE_HIT_PADDING * 2,
            padding: STAGE_HIT_PADDING,
          }}
          {...panResponder.panHandlers}
        >
          <View
            pointerEvents="none"
            style={[styles.imageFrame, { width: displayedWidth, height: displayedHeight }]}
          >
            <Image
              source={{ uri: image.uri }}
              contentFit="fill"
              style={{ width: displayedWidth, height: displayedHeight }}
            />
            <Svg width={displayedWidth} height={displayedHeight} style={StyleSheet.absoluteFill}>
              <Defs>
                <Mask id="profile-crop-box-mask">
                  <Rect width={displayedWidth} height={displayedHeight} fill="white" />
                  <Rect
                    x={cropBox.x}
                    y={cropBox.y}
                    width={cropBox.size}
                    height={cropBox.size}
                    fill="black"
                  />
                </Mask>
              </Defs>
              <Rect
                width={displayedWidth}
                height={displayedHeight}
                fill="rgba(0, 0, 0, 0.58)"
                mask="url(#profile-crop-box-mask)"
              />
              <Line
                x1={cropBox.x + cropBox.size / 3}
                y1={cropBox.y}
                x2={cropBox.x + cropBox.size / 3}
                y2={bottomEdge}
                stroke="rgba(255, 255, 255, 0.25)"
                strokeWidth={1}
              />
              <Line
                x1={cropBox.x + (cropBox.size * 2) / 3}
                y1={cropBox.y}
                x2={cropBox.x + (cropBox.size * 2) / 3}
                y2={bottomEdge}
                stroke="rgba(255, 255, 255, 0.25)"
                strokeWidth={1}
              />
              <Line
                x1={cropBox.x}
                y1={cropBox.y + cropBox.size / 3}
                x2={rightEdge}
                y2={cropBox.y + cropBox.size / 3}
                stroke="rgba(255, 255, 255, 0.25)"
                strokeWidth={1}
              />
              <Line
                x1={cropBox.x}
                y1={cropBox.y + (cropBox.size * 2) / 3}
                x2={rightEdge}
                y2={cropBox.y + (cropBox.size * 2) / 3}
                stroke="rgba(255, 255, 255, 0.25)"
                strokeWidth={1}
              />
              <Circle
                cx={cropBox.x + cropBox.size / 2}
                cy={cropBox.y + cropBox.size / 2}
                r={cropBox.size / 2}
                stroke="rgba(255, 255, 255, 0.45)"
                strokeWidth={1}
                strokeDasharray="4 4"
                fill="none"
              />
              <Rect
                x={cropBox.x}
                y={cropBox.y}
                width={cropBox.size}
                height={cropBox.size}
                stroke="#FFFFFF"
                strokeWidth={1.5}
                fill="none"
              />
              <Path
                d={cornerPath}
                stroke="#FFFFFF"
                strokeWidth={4}
                strokeLinecap="square"
                strokeLinejoin="miter"
                fill="none"
              />
            </Svg>
          </View>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: Math.max(bottomInset, Spacing.four) }]}>
        <ThemedText type="small" style={styles.hintText}>
          枠をドラッグして移動・四隅をドラッグして大きさを調整できます
        </ThemedText>
        <Pressable
          accessibilityRole="button"
          disabled={isSubmitting}
          onPress={() => setCropBox(createInitialSquareCropBox(displayedWidth, displayedHeight))}
          style={({ pressed }) => [
            styles.resetButton,
            isSubmitting && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <ThemedText type="smallBold" style={styles.resetButtonText}>
            枠をリセット
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

/**
 * 選択したプロフィール画像上で切り抜き枠を自由に移動・リサイズし、「完了」で確定するモーダル
 */
export function ProfileImageCropModal({
  image,
  isSubmitting,
  onCancel,
  onComplete,
}: ProfileImageCropModalProps) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const maxStageWidth = Math.max(200, windowWidth - 48);
  const maxStageHeight = Math.max(200, windowHeight - insets.top - insets.bottom - 180);
  const fitted = image
    ? calculateFittedImageSize(image.width, image.height, maxStageWidth, maxStageHeight)
    : null;

  return (
    <Modal
      visible={Boolean(image && fitted)}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => {
        if (!isSubmitting) {
          onCancel();
        }
      }}
    >
      {image && fitted ? (
        <CropEditor
          key={`${image.uri}-${Math.round(fitted.width)}x${Math.round(fitted.height)}`}
          image={image}
          displayedWidth={fitted.width}
          displayedHeight={fitted.height}
          topInset={insets.top}
          bottomInset={insets.bottom}
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
  imageFrame: {
    position: 'relative',
    backgroundColor: '#020617',
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
  resetButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  resetButtonText: {
    color: '#FFFFFF',
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.75,
  },
});
