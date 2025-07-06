import { FancyButton, Slider } from "@pixi/ui";
import { animate } from "motion";
import type { AnimationPlaybackControls } from "motion/react";
import type { Ticker } from "pixi.js";
import { Container } from "pixi.js";

import { engine } from "../../getEngine";
import { Viewport } from "pixi-viewport";
import { userSettings } from "../../utils/userSettings";
import { Gallery } from "./Gallery.ts";
import { WorldInvasion } from "../../model/worldinvasion.ts";


/** The screen that holds the app */
export class MainScreen extends Container {
  /** Assets bundles required by this screen */
  public static assetBundles = ["main"];

  public mainContainer: Container;

  private infoButton: FancyButton;
  private editButton: FancyButton;
  private modeButton: FancyButton;
  private tilesSlider: Slider;
  private gallery: Gallery;

  private mode: string = "flashed";
  private editMode: boolean = false;
  public viewport: Viewport;

  constructor() {
    super();
    const app = engine();
    const viewport = new Viewport({
      screenWidth: app.screen.width,
      screenHeight: app.screen.height,
      events: app.renderer.events, // the interaction module is important for wheel to work properly when renderer.view is placed or scaled
    });

    this.mainContainer = new Container({ label: "Main" });
    this.gallery = new Gallery();
    this.mainContainer.addChild(this.gallery);
    this.addChild(viewport);
    viewport.drag().bounce().decelerate();
    viewport.addChild(this.mainContainer);
    viewport.worldWidth = this.mainContainer.width;
    viewport.worldHeight = this.mainContainer.height;
    this.viewport = viewport;
    this.gallery.initAllGraphics();

    const buttonAnimations = {
      hover: {
        prsops: {
          scale: { x: 1.1, y: 1.1 },
        },
        duration: 100,
      },
      pressed: {
        props: {
          scale: { x: 0.9, y: 0.9 },
        },
        duration: 100,
      },
    };

    this.infoButton = new FancyButton({
      text: "Mode : ",
      defaultView: "white_filled_round_rect.png",
      animations: buttonAnimations,
    });

    this.addChild(this.infoButton);

    this.editButton = new FancyButton({
      text: "Mode : ",
      defaultView: "white_filled_round_rect.png",
      pressedView: "black_filled_round_rect.png"
    });
    this.editButton.anchor.set(0);
    this.addChild(this.editButton);
    this.editButton.onPress.connect(() => {
      this.editMode = !this.editMode;
      if (this.editMode)
        this.gallery.startShaking();
      else {
        this.gallery.stopShaking();
        this.exportFlashes();
      }
      this.updateButtons();
    });



    this.modeButton = new FancyButton({
      text: "Mode : ",
      defaultView: "white_filled_round_rect.png",
      pressedView: "black_filled_round_rect.png"
    });
    this.modeButton.onPress.connect(() => {
      switch (this.mode) {
        case "missing":
          this.mode = "flashed";
          break;
        case "flashed":
          this.mode = "all";
          break;
        case "all":
          this.mode = "missing";
          break;
      }

      this.gallery.setMode(this.mode);
      this.gallery.layout();
      this.updateButtons();
    });
    this.modeButton.anchor.set(0);
    this.addChild(this.modeButton);
    this.updateButtons();
    var tpr = userSettings.getTilesPerRow();
    this.tilesSlider = new Slider({
      bg: 'pattern_round_rect.png',
      fill: 'pattern_round_rect.png',
      slider: 'slider.png',
      min: 3,
      max: 18,
      value: tpr,
      step: 1
    });

    this.tilesSlider.onUpdate.connect((v) => {
      userSettings.setTilesPerRow(v);
      // complete layout,keep vertical location
      this.gallery.layout();
    });
    this.addChild(this.tilesSlider);
  }

  public capitalize(str: string) {
    return str[0].toUpperCase() + str.slice(1);
  }

  public exportFlashes() {
    const world_invasion = WorldInvasion.GetInstance();
    const flasher = world_invasion.flasher;
console.log(flasher.getFlashFile());
  }

  public updateButtons() {
    this.modeButton.text = `\u27F3 ${this.capitalize(this.mode)} mode`;
    this.modeButton.visible = this.editMode == false;
    this.editButton.text = this.editMode ? "Done" : "Edit";
    this.editButton.visible = this.mode == "all";
    const world_invasion = WorldInvasion.GetInstance();
    const num_invaders = world_invasion.num_invaders;
    const num_cities = world_invasion.sorted_cities_codes.length;
    const flasher = world_invasion.flasher;
    const num_flashed = flasher.getTotalFlashes();
    const cities_flashed = flasher.getNumFlashedCities();
    this.infoButton.text = `Flashes:  ${num_flashed} / ${num_invaders} - Cities: ${cities_flashed} /  ${num_cities}`;
  }
  /** Prepare the screen just before showing */
  public prepare() {

  }

  /** Update the screen */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public update(_time: Ticker) {
    this.gallery.update();
    this.updateButtons();
  }

  /** Fully reset */
  public reset() { }

  /** Resize the screen, fired whenever window size changes */
  public resize(width: number, height: number) {
    const xoffset = 10;
    const modebuttonwidth = 200;
    const editbuttonwidth = 200;
    const sliderwidth = 256;
    const componentspos = 64;
    const componentsy = height - componentspos;
    const componentsheight = 32;


    this.infoButton.x = xoffset;
    this.infoButton.y = componentsy - componentspos + 20;
    this.infoButton.width = width - 2 * xoffset;
    this.infoButton.height = componentsheight

    this.modeButton.x = xoffset;
    this.modeButton.y = componentsy;
    this.modeButton.width = modebuttonwidth;
    this.modeButton.height = componentsheight;
    this.editButton.x = 2 * xoffset + modebuttonwidth;
    this.editButton.width = editbuttonwidth;
    this.editButton.height = componentsheight;
    this.editButton.y = componentsy;
    this.tilesSlider.x = 3 * xoffset + modebuttonwidth + editbuttonwidth
    this.tilesSlider.width = sliderwidth;
    this.tilesSlider.height = componentsheight;
    this.tilesSlider.y = componentsy + 10;

    this.gallery.layout();
  }

  /** Show screen with animations */
  public async show(): Promise<void> {
   
    const elementsToAnimate = [
      this.infoButton,
      this.editButton,
      this.modeButton,
      this.tilesSlider
    ];

    let finalPromise!: AnimationPlaybackControls;
    for (const element of elementsToAnimate) {
      element.alpha = 0;
      finalPromise = animate(
        element,
        { alpha: 1 },
        { duration: 0.3, delay: 0.75, ease: "backOut" },
      );
    }
    await finalPromise;

  }

  /** Hide screen with animations */
  public async hide() { }

  /** Auto pause the app when window go out of focus */
  public blur() {
    return;
  }

  static InvaderFormat = ((num: number) => {
    return num < 10 ? "0" + num : "" + num;

  });

}
