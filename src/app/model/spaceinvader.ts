import { Container, Sprite, Texture } from "pixi.js";
import { engine } from "../getEngine";

export class SpaceInvader {
    public code: string;
    public city_code: string;
    public order: number;
    public state: string = "A";
    public date: string = "";
    public sprite!: Sprite;

    constructor(si_code: string) {
        this.code = si_code;
        let { city_code, order } = SpaceInvader.CodeToParts(si_code);
        this.city_code = city_code;
        this.order = order;
    }

    static CodeToParts(invader_code: string): any {
        const parts = invader_code.split("_");
        return { city_code: parts[0], order: Number(parts[1]) };
    }

    static BuildSprite(si_code: string, status: string, flashed: boolean): Sprite {
        var container = new Container();

        let sprite = new Sprite({ texture: Texture.from(si_code) });
        //console.log(sprite.width, sprite.height);
        container.addChild(sprite);
        sprite.anchor.set(0);
        //   console.log(si_info);
        if (status != "A") {
            let ssprite = new Sprite({ texture: Texture.from(status), anchor: 0 });
            ssprite.x = sprite.width - ssprite.width;
            ssprite.anchor.set(0, 0);
            container.addChild(ssprite);
        }
        if (flashed) {
            let fsprite = new Sprite({ texture: Texture.from("F"), anchor: 0 });
            fsprite.y = sprite.height - fsprite.height;
            fsprite.anchor.set(0, 0);
            container.addChild(fsprite);
        }
        container.cacheAsTexture(true);
        const bakedtexture = engine().renderer.generateTexture(container);
        var finalSprite = new Sprite(bakedtexture);
        finalSprite.anchor.set(0, 0);
        //  console.log(finalSI.width, finalSI.height);
    
        finalSprite.label = si_code;
        finalSprite.eventMode = "static";

        return finalSprite;
    }

}