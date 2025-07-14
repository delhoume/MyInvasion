import { FancyButton } from "@pixi/ui";
import { Graphics } from "pixi.js";

export class MyButton extends FancyButton {
  constructor(options : Object) {
    super({
      defaultView: new Graphics()
        .roundRect(0, 0, options.width, options.height, options.radius)
        .fill({ color: "SkyBlue" }),
      hoverView: new Graphics()
        .roundRect(0, 0, options.width, options.height, options.radius)
        .fill({ color: "LightBlue" }),
      pressedView: new Graphics()
        .roundRect(0, 0, options.width, options.height, options.radius)
        .fill({ color: "LightCoral" }),
      disabledView: new Graphics()
        .roundRect(0, 0, options.width, options.height, options.radius)
        .fill({ color: "DarkGray" }),
      width: options.width,
      height: options.height,
      anchor: 0.5,
      text: options.text,
      animations: {
        hover: {
          props: {
            scale: {
              x: 1.05,
              y: 1.05
            }
          },
          duration: 100
        },
        pressed: {
          props: {
            scale: {
              x: 0.95,
              y: 0.95
            }
          },
          duration: 100
        }
      }
    });
  }
}