import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, {
  Circle,
  Marker,
  type MapPressEvent,
  type MarkerDragStartEndEvent,
  type Region,
} from 'react-native-maps';

import type { Coordinates, PlaceRadius } from '@/domain/entities/island';
import { ThemedText } from '@/presentation/components/themed-text';

import type { PlaceMapPickerProps } from './place-map-picker-types';

const DEFAULT_CENTER: Coordinates = {
  latitude: 35.681236,
  longitude: 139.767125,
};

function getDeltaForRadius(radius: PlaceRadius): number {
  if (radius >= 500) return 0.016;
  if (radius >= 200) return 0.008;
  return 0.005;
}

function buildRegion(coords: Coordinates | null, radius: PlaceRadius): Region {
  if (!coords) {
    return {
      latitude: DEFAULT_CENTER.latitude,
      longitude: DEFAULT_CENTER.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
  }
  const delta = getDeltaForRadius(radius);
  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
    latitudeDelta: delta,
    longitudeDelta: delta,
  };
}

/**
 * 登録場所のピン位置と判定半径を地図上で確認・調整するコンポーネント
 */
export function PlaceMapPicker({
  coordinates,
  radius,
  accentColor,
  fillColor,
  focusVersion,
  onChangeCoordinates,
}: PlaceMapPickerProps) {
  const mapRef = useRef<MapView | null>(null);
  const [initialRegion] = useState<Region>(() => buildRegion(coordinates, radius));
  const lastFocusedVersionRef = useRef(0);
  const hasCenteredInitialRef = useRef(Boolean(coordinates));

  useEffect(() => {
    if (!coordinates) {
      return;
    }
    const shouldFocusInitial = !hasCenteredInitialRef.current;
    const shouldFocusExplicit = focusVersion > 0 && focusVersion !== lastFocusedVersionRef.current;

    if (!shouldFocusInitial && !shouldFocusExplicit) {
      return;
    }

    hasCenteredInitialRef.current = true;
    lastFocusedVersionRef.current = focusVersion;
    mapRef.current?.animateToRegion(buildRegion(coordinates, radius), 250);
  }, [coordinates, focusVersion, radius]);

  const handleMapPress = (event: MapPressEvent) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    onChangeCoordinates({ latitude, longitude });
  };

  const handleMarkerDragEnd = (event: MarkerDragStartEndEvent) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    onChangeCoordinates({ latitude, longitude });
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        onPress={handleMapPress}
      >
        {coordinates && (
          <>
            <Circle
              center={coordinates}
              radius={radius}
              strokeColor={accentColor}
              fillColor={fillColor}
              strokeWidth={2}
            />
            <Marker
              coordinate={coordinates}
              draggable
              pinColor={accentColor}
              onDragEnd={handleMarkerDragEnd}
            />
          </>
        )}
      </MapView>
      <View style={styles.hintBar}>
        <ThemedText type="small" themeColor="textSecondary">
          {coordinates
            ? '地図をタップ、またはピンを長押しドラッグして中心位置を調整できます'
            : '「現在地を取得してピンを置く」か地図をタップして位置を決めてください'}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.2)',
  },
  map: {
    width: '100%',
    height: 260,
  },
  hintBar: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});
