import "@pixi/layout";
import { Container } from "pixi.js";
import { engine } from "../../getEngine";
import { VolumeSlider } from "../../ui/VolumeSlider";
import { Button } from "@pixi/ui";

export class GUIPanel extends Component {
  private editButton: Button;
  private tilesSlider: VolumeSlider;

  constructor(parent: Container, options: any) {
    super(options);
    const app = engine();
    this.layout = {
      width: app.screen.width,
      height: app.screen.height,
      justifyContent: 'center',
      alignItems: 'center',
    }
    parent.addChild(this);
  }


  public build() {
  this.editButton = new Button({
    text: "Edit Flashes",
    width: 175,
    height: 110,
  });
  this.addChild(this.editButton);


  this.tilesSlider = new VolumeSlider("ddcd", 3, 18, 6);
  this.tilesSlider.step = 3;
  this.addChild(this.tilesSlider);

  // Create a grid of bunny sprites
  for (let i = 0; i < 10; i++) {
    // Create a bunny Sprite and enable layout
    // The width/height of the bunny will be the size of the texture by default
    const bunny = new Sprite({ texture, layout: true });

    // Add the bunny to the container
    this.addChild(bunny);
  }

}
  
public remove(): void {}

  public update(): void {}

  public resize(w: number, h: number): void {

}
}
