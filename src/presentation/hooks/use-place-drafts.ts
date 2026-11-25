import { useRef, useState } from 'react';

import {
  type Coordinates,
  DEFAULT_PLACE_RADIUS,
  type PlaceIslandType,
  type PlaceRadius,
  type RegisteredPlaces,
} from '@/domain/entities/island';

type PlaceDraft = {
  coordinates: Coordinates | null;
  radius: PlaceRadius;
  version: number;
};

/**
 * 家・学校の場所登録画面における未保存ドラフト（座標・半径・編集バージョン）を管理するフック
 */
export function usePlaceDrafts(
  selectedType: PlaceIslandType,
  savedPlaces: RegisteredPlaces | undefined,
) {
  const [drafts, setDrafts] = useState<Partial<Record<PlaceIslandType, PlaceDraft>>>({});
  const draftVersionRef = useRef(0);

  const savedPlaceForTab = savedPlaces?.[selectedType] ?? null;
  const currentDraft = drafts[selectedType];
  const draftCoords =
    currentDraft !== undefined ? currentDraft.coordinates : (savedPlaceForTab?.coordinates ?? null);
  const draftRadius =
    currentDraft !== undefined
      ? currentDraft.radius
      : (savedPlaceForTab?.radius ?? DEFAULT_PLACE_RADIUS);

  const updateDraft = (patch: Partial<Omit<PlaceDraft, 'version'>>) => {
    draftVersionRef.current += 1;
    const nextVersion = draftVersionRef.current;
    setDrafts((prev) => {
      const base = prev[selectedType] ?? {
        coordinates: savedPlaceForTab?.coordinates ?? null,
        radius: savedPlaceForTab?.radius ?? DEFAULT_PLACE_RADIUS,
        version: nextVersion,
      };
      return {
        ...prev,
        [selectedType]: {
          ...base,
          ...patch,
          version: nextVersion,
        },
      };
    });
  };

  const clearDraftIfUnchanged = (type: PlaceIslandType, expectedVersion: number | undefined) => {
    setDrafts((prev) => {
      if (!(type in prev) || prev[type]?.version !== expectedVersion) {
        return prev;
      }
      const next = { ...prev };
      delete next[type];
      return next;
    });
  };

  const getDraftVersion = (type: PlaceIslandType) => drafts[type]?.version;

  const hasLocationForType = (type: PlaceIslandType) =>
    Boolean(drafts[type]?.coordinates || savedPlaces?.[type]?.coordinates);

  return {
    savedPlaceForTab,
    draftCoords,
    draftRadius,
    updateDraft,
    clearDraftIfUnchanged,
    getDraftVersion,
    hasLocationForType,
  };
}
