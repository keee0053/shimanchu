import type { AvatarConfig } from '../entities/avatar';

export type AvatarRepository = {
  /** 自分のアバター設定。profiles の行がまだなければ null */
  findMine(): Promise<AvatarConfig | null>;
  /** 自分のアバター設定を更新する（profiles の行がある前提） */
  updateMine(config: AvatarConfig): Promise<void>;
};
