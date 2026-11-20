import * as Location from 'expo-location';

/**
 * 通常の島判定（フォアグラウンド取得・移動監視）で使う位置精度（約100m）
 */
export const FOREGROUND_LOCATION_ACCURACY = Location.Accuracy.Balanced;

/**
 * 家・学校の場所を登録するときに使う位置精度
 */
export const PLACE_REGISTRATION_LOCATION_ACCURACY = Location.Accuracy.High;

/**
 * アプリを開いている間に再判定を行う移動距離のしきい値（メートル）
 */
export const FOREGROUND_DISTANCE_INTERVAL_METERS = 100;

/**
 * 島が変わらなくても user_presence を定期 upsert して updated_at を進める間隔（ミリ秒: 15分）
 */
export const PRESENCE_HEARTBEAT_INTERVAL_MS = 15 * 60 * 1000;
