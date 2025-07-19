import { Assets, Container, Graphics, Rectangle, Sprite, Texture } from "pixi.js";
import { engine } from "../getEngine";
import { WorldInvasion } from "./worldinvasion";

export class SpaceInvader {
  public code: string;
  public city_code: string;
  public order: number;
  public state: string = "A";
  public date: string = "";
  public sprite!: Sprite;



  constructor(si_code: string) {
    this.code = si_code;
    const { city_code, order } = SpaceInvader.CodeToParts(si_code);
    this.city_code = city_code;
    this.order = order;
    const texture = Assets.get("missing.jpg");
    this.sprite = new Sprite(texture);
  }

  static CodeToParts(invader_code: string): {
    city_code: string;
    order: number;
  } {
    const parts = invader_code.split("_");
    return { city_code: parts[0], order: Number(parts[1]) };
  }

  static BuildTexture(si_code: string, status: string, flashed: boolean, mode: string): Texture {
    const container = new Container();
    var texture = Texture.from(si_code);
    if (!texture)
      texture = Assets.get("missing.jpg");
    const sprite = new Sprite({ texture: texture });
    //console.log(sprite.width, sprite.height);
    container.addChild(sprite);
    sprite.anchor.set(0);
    //   console.log(si_info);
    if (status != "A") {
      const ssprite = new Sprite({ texture: Texture.from(status), anchor: 0 });
      ssprite.x = sprite.width - ssprite.width;
      ssprite.anchor.set(0, 0);
      container.addChild(ssprite);
    }
    if (mode && mode == "all") {
      if (flashed) {
      const flashedmethod = "tintgreen";
      switch (flashedmethod) {
        case "tintgreen": {
          const bb: Rectangle = sprite.getBounds();
          const g = new Graphics().rect(bb.left, bb.top, bb.width, bb.height).
            fill({ color: "00ff0044" });
          container.addChild(g);

        } break;
        case "greenborder": {
          const bb: Rectangle = sprite.getBounds();
          const g = new Graphics().rect(bb.left, bb.top, bb.width, bb.height).
            stroke({ width: 10, color: "green" });
          container.addChild(g);

        } break;
        default: {
          const fsprite = new Sprite({ texture: Texture.from("F"), anchor: 0 });
          fsprite.y = sprite.height - fsprite.height;
          fsprite.anchor.set(0, 0);
          container.addChild(fsprite);
        }
          break;
    }
    }
  }
    container.cacheAsTexture(true);
    const bakedtexture = engine().renderer.generateTexture(container);
    return bakedtexture;
  }

  static GetState(si_code: string) {
    const si = WorldInvasion.GetInstance().invader(si_code);
    return si.state;
  }
}
