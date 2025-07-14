import { FancyButton, Slider } from "@pixi/ui";
import { animate } from "motion";
import type { AnimationPlaybackControls } from "motion/react";
import type { Ticker } from "pixi.js";
import { Container, Graphics, Point, Text, TextStyle } from "pixi.js";

import { engine } from "../../getEngine";
import { Viewport } from "pixi-viewport";
import { userSettings } from "../../utils/userSettings";
import { Gallery } from "./Gallery.ts";
import { WorldInvasion } from "../../model/worldinvasion.ts";
import { BackdropBlurFilter } from "pixi-filters";
import { MyButton } from '../../ui/MyButton.ts';

/** The screen that holds the app */
export class MainScreen extends Container {
  /** Assets bundles required by this screen */
  public static assetBundles = ["main"];

  public mainContainer: Container;
  public graphics: Graphics;
  private infoArea: Container;
  private scoreReport: Text;
  private editButton: MyButton;
  private doneButton: MyButton
  private cancelButton: MyButton;
  private modeButton: MyButton;
  private tilesSlider: Slider;
  private gallery: Gallery;

  public static DefaultMode: string = "flashedonly";
  private mode: string = MainScreen.DefaultMode; // "all", "missing", "flashedonly", "fullcity"
  private editMode: boolean = false;
  public viewport: Viewport;
  private dragTarget : any = null;
private dragStarpoint ; Point = new Point(0, 0);
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

    this.infoArea = new Container({ label: "UI" });
    this.addChild(this.infoArea);
 
     this.graphics = new Graphics();
  this.graphics
      .rect(0, 0, 600, 200)
      .fill({ color: 0xffffff, alpha: 0.1 });
    const filter = new BackdropBlurFilter({ strength: 10 });
    this.graphics.filters = [filter];
    this.infoArea.addChild(this.graphics);
this.graphics.eventMode = 'static';

    this.graphics.on('pointerup', onDragEnd);
  this.graphics.on('pointerupoutside', onDragEnd);
this.graphics.on('pointerdown', onDragStart, this.infoArea);
const t = this;
  function onDragMove(event: any) {
            if (t.dragTarget) {   
const xdiff = event.global.x - t.dragStarpoint.x ;
const ydiff = event.global.y - t.dragStarpoint.y;
     t.dragTarget.position.set(t.dragTarget.x + xdiff,
        t.dragTarget.y + ydiff);
        t.dragStarpoint = new Point(event.global.x, event.global.y);
      
    }
  }

  function onDragStart(event: any) {
     // Store a reference to the data
    // * The reason for this is because of multitouch *
    // * We want to track the movement of this particular touch *
    t.dragTarget = t.infoArea ;
    t.dragStarpoint = new Point(event.global.x, event.global.y);
     t.graphics.on('pointermove', onDragMove);
  }

  function onDragEnd() {
    if (t.dragTarget) {
       t.graphics.off('pointermove', onDragMove);
      t.dragTarget = null;
    }
  }


      this.infoArea.position.set(300, 300);

    const scoreStyle = new TextStyle({
      fontFamily: "Space Invaders",
      fontSize: 15,
      fill: "white",
      stroke: {
        color: "#000000",
        width: 3,
      },
    });

    const xoffset = 10;
    const modewidth = 200;
    const editwidth = 200;
    const buttonstarty = 80;
    const buttonrowheight = 30;
    const subeditbuttonwidth = (editwidth - xoffset) / 2;

    this.modeButton = new MyButton({ text: "Mode", width: modewidth, height: 24 });
    this.modeButton.position.set(xoffset, buttonstarty);
    this.modeButton.anchor.set(0);
    this.infoArea.addChild(this.modeButton);

    this.scoreReport = new Text({ text: "score", style: scoreStyle });
    this.infoArea.addChild(this.scoreReport);


    this.editButton = new MyButton({ text: "Edit", width: editwidth, height: 24 });
    this.editButton.position.set(2 * xoffset + modewidth, buttonstarty);
    this.editButton.anchor.set(0);
    this.infoArea.addChild(this.editButton);
    this.editButton.onPress.connect(() => {
      this.editMode = !this.editMode;
      if (this.editMode) this.gallery.startShaking();
      else {
        this.gallery.stopShaking();
        this.exportFlashes();
      }
      this.updateScore();
    });

    this.doneButton = new MyButton({ text: "Done", width: subeditbuttonwidth, height: 24 });
    this.doneButton.anchor.set(0);
    this.doneButton.position.set(this.editButton.x, buttonstarty + buttonrowheight);

    this.infoArea.addChild(this.doneButton);
    this.doneButton.onPress.connect(() => {
      console.log("done")
    });

    this.cancelButton = new MyButton({ text: "Cancel", width: subeditbuttonwidth, height: 24 });
    this.cancelButton.anchor.set(0);
    this.cancelButton.position.set(this.doneButton.x + this.doneButton.width + xoffset, buttonstarty + buttonrowheight);
    this.infoArea.addChild(this.cancelButton);

    this.cancelButton.onPress.connect(() => {
      console.log("cancel")
    });

    
    this.modeButton.onPress.connect(() => {
      switch (this.mode) {
        case "missing":
          this.mode = "flashedonly";
          break;
        case "flashedonly":
          this.mode = "all";
          break;
        case "all":
          this.mode = "fullcity";
          break;
        case "fullcity":
          this.mode = "missing";
          break;
      }

      this.gallery.setMode(this.mode);
      this.gallery.layout();
      this.updateScore();
    });

    this.updateScore();
    const tpr = userSettings.getTilesPerRow();
    this.tilesSlider = new Slider({
      bg: "pattern_round_rect.png",
      fill: "pattern_round_rect.png",
      slider: "slider.png",
      min: 3,
      max: 33,
      value: tpr,
      step: 1,
    });

    this.tilesSlider.onUpdate.connect((v) => {
      userSettings.setTilesPerRow(v);
      // complete layout,keep vertical location
      this.gallery.layout();
    });
    this.tilesSlider.position.set(xoffset, buttonstarty + buttonrowheight * 2 + 10);
    this.tilesSlider.width = modewidth + editwidth + xoffset;
    this.tilesSlider.height = 50;
    this.infoArea.addChild(this.tilesSlider);
  }

  public capitalize(str: string) {
    return str[0].toUpperCase() + str.slice(1);
  }

  public exportFlashes() {
    const world_invasion = WorldInvasion.GetInstance();
    const flasher = world_invasion.flasher;
    const fileflash = flasher.getFlashFile();
    console.log(fileflash);
    // copy toclipboard
    navigator.clipboard.writeText(fileflash);
  }

  public updateScore() {
    this.modeButton.text = `${this.capitalize(this.mode)}`;

    const world_invasion = WorldInvasion.GetInstance();
    const num_invaders = world_invasion.num_invaders;
    const num_cities = world_invasion.sorted_cities_codes.length;
    const flasher = world_invasion.flasher;
    const num_flashed = flasher.getTotalFlashes();
    const cities_complete = flasher.getNumCompleteCities();
    const cities_flashed = flasher.getNumFlashedCities();
    const cities_displayed = this.gallery.num_displayed_cities;
    const invaders_displayed = this.gallery.num_displayed_invaders
    this.scoreReport.text = `Cities: invaded ${num_cities} - displayed ${cities_displayed} - missing  ${num_cities - cities_flashed} - incomplete ${num_cities - cities_complete} \n\nInvaders: total ${num_invaders} - flashed ${num_flashed} - displayed ${invaders_displayed} `;
  }

  /** Prepare the screen just before showing *  public prepare() { }

  /** Update the screen */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public update(_time: Ticker) {
    this.gallery.update();
    this.updateScore();
  }

  /** Fully reset */
  public reset() { }

  /** Resize the screen, fired whenever window size changes */
  public resize(width: number, height: number) {
    /*
        const xoffset = 10;
        const modebuttonwidth = 300;
        const editbuttonwidth = 150;
        const sliderwidth = 256;
        const componentspos = 64;
    
        const bottom_phone_offset = 100; const componentsy = height - componentspos - bottom_phone_offset;;
        const componentsheight = 24;
    
        const allheight = 200;
    
        const firstrow = height - allheight;
        const secondrow = firstrow + 40;
        this.modeButton.x = xoffset;
        this.modeButton.y = firstrow;;
        this.modeButton.width = modebuttonwidth;
        this.editButton.x = 2 * xoffset + modebuttonwidth;
        this.editButton.width = editbuttonwidth;
        this.editButton.y = firstrow;
        this.tilesSlider.x = 3 * xoffset + modebuttonwidth + editbuttonwidth;
        this.tilesSlider.width = sliderwidth;
        this.tilesSlider.height = componentsheight;
        this.tilesSlider.y = secondrow;
    
       // this.cancelButton.width = this.editButton.width / 2 - xoffset;
        this.cancelButton.x = this.editButton.x - ((this.editButton.width / 3) + xoffset);
       // this.cancelButton.y = secondrow;
    
    
        //this.doneButton.x = this.editButton.x + (this.editButton.width / 3 + xoffset);
        //this.doneButton.y = secondrow;
        this.doneButton.width = this.cancelButton.width;
    
        this.graphics.position.set(0, 0);
        this.graphics.width = this.tilesSlider.x + this.tilesSlider.width + xoffset;
        this.graphics.height = 200;
        this.scoreReport.x = xoffset;
        this.scoreReport.y = 10;
        this.infoArea.x = 0;
        this.infoArea.y = componentsy - componentspos;
    */
    this.gallery.layout();
  }


  /** Show screen with animations */
  public async show(): Promise<void> {
    const elementsToAnimate = [
      this.scoreReport,
      this.editButton,
      this.modeButton,
      this.tilesSlider,
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

  static InvaderFormat = (num: number) => {
    return num < 10 ? "0" + num : "" + num;
  };
}
