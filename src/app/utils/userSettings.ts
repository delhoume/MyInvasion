import { storage } from "../../engine/utils/storage";
import { engine } from "../getEngine";

// Keys for saved items in storage
const KEY_VOLUME_SFX = "volume-sfx";
const KEY_TILES_PER_ROW = "graphics-tpr";

/**
 * Persistent user settings of volumes.
 */
class UserSettings {
  public init() {
    engine().audio.sfx.setVolume(this.getSfxVolume());
  }

  /** Get tiles per row */
  public getTilesPerRow() {
    return storage.getNumber(KEY_TILES_PER_ROW) ?? 6;
  }

  /** Set tiles per row  */
  public setTilesPerRow(value: number) {
    storage.setNumber(KEY_TILES_PER_ROW, value);
  }


  /** Get sound effects volume */
  public getSfxVolume() {
    return storage.getNumber(KEY_VOLUME_SFX) ?? 1;
  }

  /** Set sound effects volume */
  public setSfxVolume(value: number) {
    engine().audio.sfx.setVolume(value);
    storage.setNumber(KEY_VOLUME_SFX, value);
  }
}

/** SHared user settings instance */
export const userSettings = new UserSettings();
