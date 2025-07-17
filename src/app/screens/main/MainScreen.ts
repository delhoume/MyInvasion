import { FancyButton, Slider } from "@pixi/ui";
import { animate } from "motion";
import type { AnimationPlaybackControls } from "motion/react";
import type { Ticker } from "pixi.js";
import {
  Container,
  Graphics,
  NineSliceSprite,
  Point,
  Text,
  TextStyle,
  Texture,
} from "pixi.js";

import { engine } from "../../getEngine";
import { Viewport } from "pixi-viewport";
import { userSettings } from "../../utils/userSettings";
import { Gallery } from "./Gallery.ts";
import { WorldInvasion } from "../../model/worldinvasion.ts";
import { BackdropBlurFilter } from "pixi-filters";
import { Flasher } from "../../model/flasher.ts";

/** The screen that holds the app */
export class MainScreen extends Container {
  /** Assets bundles required by this screen */
  public static assetBundles = ["main"];

  public mainContainer: Container;
  public graphics: Graphics;
  private infoArea: Container;
  private scoreReport: Text;
  private editButton: FancyButton;
  private doneButton: FancyButton;
  private cancelButton: FancyButton;

  private importButton: FancyButton;
  private exportButton: FancyButton;
  private modeButton: FancyButton;
  private tilesSlider: Slider;
  private gallery: Gallery;

  public static DefaultMode: string = "flashedonly";
  private mode: string = MainScreen.DefaultMode; // "all", "missing", "flashedonly", "fullcity"
  private editMode: boolean = false;
  public viewport: Viewport;
  private dragTarget: any = null;
  private dragStarpoint: Point = new Point(0, 0);
  public savedFlashed: string = "";

  public static MinTilesPerRow: number = 3;
  public static MaxTilesPerRow: number = 30;
  public static TilesPerRowStep: number = 1; // smooth

  constructor() {
    super();
    const app = engine();
    const viewport = new Viewport({
      screenWidth: app.screen.width,
      screenHeight: app.screen.height,
      events: app.renderer.events, // the interaction module is important for wheel to work properly when renderer.view is placed or scaled
    });

    this.mainContainer = new Container({ label: "Main" });
    this.gallery = new Gallery(viewport);
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
    this.graphics.rect(0, 0, 600, 200).fill({ color: 0xffffff, alpha: 0.1 });
    const filter = new BackdropBlurFilter({ strength: 5 });
    this.graphics.filters = [filter];
    this.infoArea.addChild(this.graphics);
    this.graphics.eventMode = "static";

    this.graphics.on("pointerup", onDragEnd);
    this.graphics.on("pointerupoutside", onDragEnd);
    this.graphics.on("pointerdown", onDragStart, this.infoArea);
    const t = this;
    function onDragMove(event: any) {
      if (t.dragTarget) {
        const xdiff = event.global.x - t.dragStarpoint.x;
        const ydiff = event.global.y - t.dragStarpoint.y;
        t.dragTarget.position.set(
          t.dragTarget.x + xdiff,
          t.dragTarget.y + ydiff
        );
        t.dragStarpoint = new Point(event.global.x, event.global.y);
      }
    }

    function onDragStart(event: any) {
      // Store a reference to the data
      // * The reason for this is because of multitouch *
      // * We want to track the movement of this particular touch *
      t.dragTarget = t.infoArea;
      t.dragStarpoint = new Point(event.global.x, event.global.y);
      t.graphics.on("pointermove", onDragMove);
    }

    function onDragEnd() {
      if (t.dragTarget) {
        t.graphics.off("pointermove", onDragMove);
        t.dragTarget = null;
      }
    }

    const scoreStyle = new TextStyle({
      fontFamily: "Space Invaders",
      fontSize: 15,
      fill: "white",
      stroke: {
        color: "#000000",
        width: 3,
      },
    });
    const buttonsStyle = new TextStyle({
      fontFamily: "Space Invaders", // "Los Altos",
      fontSize: 12,
      fill: "black",
    });

    const UIwidth = 500;
    const UIheight = 250;
    const xoffset = 10;
    const yoffset = 5;
    const modewidth = (UIwidth - 3 * xoffset) / 2;
    const editwidth = modewidth;
    const buttonstarty = 80;
    const buttonheight = 24;
    const buttonrowheight = buttonheight + 10;
    const subeditbuttonwidth = (editwidth - xoffset) / 2;

    const modeText = new Text({ text: "Mode", style: buttonsStyle });
    this.modeButton = new FancyButton({
      text: modeText,
      defaultView: "ninesplicebutton.png",
      nineSliceSprite: [12, 12, 12, 12],
    });
    this.modeButton.position.set(xoffset, buttonstarty);
    this.modeButton.width = modewidth;
    this.modeButton.height = buttonheight;
    this.modeButton.anchor.set(0);
    this.infoArea.addChild(this.modeButton);

    this.scoreReport = new Text({ text: "score", style: scoreStyle });
    this.scoreReport.position.set(xoffset, xoffset);
    this.infoArea.addChild(this.scoreReport);

    const editText = new Text({ text: "Edit", style: buttonsStyle });
    this.editButton = new FancyButton({
      text: editText,
      defaultView: "ninesplicebutton.png",
      nineSliceSprite: [12, 12, 12, 12],
    });
    this.editButton.anchor.set(0);
    this.editButton.position.set(2 * xoffset + modewidth, buttonstarty);
    this.editButton.width = modewidth;
    this.editButton.height = buttonheight;

    this.infoArea.addChild(this.editButton);
    this.editButton.onPress.connect(() => {
      this.editMode = !this.editMode;
      if (this.editMode) {
        this.gallery.startShaking();
        this.saveCurrentFlashes();
      } else {
      }
      this.updateScore();
    });

    const importText = new Text({ text: "Import", style: buttonsStyle });
    this.importButton = new FancyButton({
      text: importText,
      defaultView: "ninesplicebutton.png",
      nineSliceSprite: [12, 12, 12, 12],
    });
    this.importButton.width = subeditbuttonwidth;
    this.importButton.height = buttonheight;
    this.importButton.position.set(
      this.modeButton.x,
      buttonstarty + buttonrowheight
    );
    this.importButton.anchor.set(0);

    this.infoArea.addChild(this.importButton);
    this.importButton.onPress.connect(() => {
      console.log("import");
      navigator.permissions.query({ name: "clipboard-read", requestedOrigin: window.location.origin }).then((result) => {
        if (result.state === "granted") {
          console.log("permission read granted");
          navigator.clipboard.readText().then((text) => {
            console.log("text", text);
            const world_invasion = WorldInvasion.GetInstance();
            const flasher = new Flasher("NoName")
            flasher.init(text);
            world_invasion.initFromFlasher(flasher);
            this.gallery.updateAllSprites();
            this.updateScore();
            this.gallery.layout();
          });
        } else {
          console.log("permission read not granted");
        }
      });
    });

  const exportText = new Text({ text: "export", style: buttonsStyle });
    this.exportButton = new FancyButton({
    text: exportText,
    defaultView: "ninesplicebutton.png",
    nineSliceSprite: [12, 12, 12, 12],
  });
this.exportButton.width = subeditbuttonwidth;
this.exportButton.height = buttonheight;
this.exportButton.position.set(
  this.modeButton.x + subeditbuttonwidth + xoffset,
  buttonstarty + buttonrowheight
);
this.exportButton.anchor.set(0);

this.infoArea.addChild(this.exportButton);
this.exportButton.onPress.connect(() => {
  const world_invasion = WorldInvasion.GetInstance();
  const flasher = world_invasion.flasher;
  const contents = flasher.getFlashFile();
  console.log(contents);
  navigator.permissions.query({ name: "clipboard-write", requestedOrigin: window.location.origin }).then((result) => {
    if (result.state === "granted") {
      navigator.clipboard.writeText(contents).then(() => { })
    };
  });
});
const doneText = new Text({ text: "Done", style: buttonsStyle });
this.doneButton = new FancyButton({
  text: doneText,
  defaultView: "ninesplicebutton.png",
  nineSliceSprite: [12, 12, 12, 12],
});
this.doneButton.width = subeditbuttonwidth;
this.doneButton.height = buttonheight;
this.doneButton.position.set(
  this.editButton.x,
  buttonstarty + buttonrowheight
);
this.doneButton.anchor.set(0);

this.infoArea.addChild(this.doneButton);
this.doneButton.onPress.connect(() => {
  this.gallery.stopShaking();
});

const cancelText = new Text({ text: "Cancel", style: buttonsStyle });
this.cancelButton = new FancyButton({
  text: cancelText,
  defaultView: "ninesplicebutton.png",
  nineSliceSprite: [12, 12, 12, 12],
});

this.cancelButton.width = subeditbuttonwidth;
this.cancelButton.height = buttonheight;
this.cancelButton.position.set(
  this.doneButton.x + this.doneButton.width + xoffset,
  buttonstarty + buttonrowheight
);
this.infoArea.addChild(this.cancelButton);

this.cancelButton.onPress.connect(() => {
  this.gallery.stopShaking();
  this.restoreFlashes();
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
  "bg": "slider_bg_outline.png",
  "fill": "slider_bg_filled_white.png",
  "slider": "slider_outline_inverted.png",
  nineSliceSprite: {
    bg: [2, 2, 8, 8],
    fill: [2, 2, 78, 8]
  },
  min: MainScreen.MinTilesPerRow,
  max: MainScreen.MaxTilesPerRow,
  value: tpr,
  step: MainScreen.TilesPerRowStep,
  valueTextStyle: {
    fill: "white",
    fontSize: 14,
    fontFamily: "Space Invaders"
  },
  showValue: true,
  valueTextOffset: {
    y: 25,
  }
});

this.tilesSlider.onUpdate.connect((v) => {
  userSettings.setTilesPerRow(v);
  // complete layout,keep vertical location
  this.gallery.layout();
});
this.tilesSlider.position.set(
  xoffset,
  buttonstarty + buttonrowheight * 2 + 2 * yoffset - 5);
this.tilesSlider.width = modewidth + editwidth + xoffset;
//    this.tilesSlider.height = 50;

this.infoArea.addChild(this.tilesSlider);
this.infoArea.position.set(
  10,
  engine().screen.height - this.infoArea.height
);
  }

  public capitalize(str: string) {
  return str[0].toUpperCase() + str.slice(1);
}


  static modeToString: any = {
  flashedonly: "Flashed",
  all: "All",
  fullcity: "Complete cities",
  missing: "Not Flashed",
};
  public updateScore() {
  this.modeButton.text = `${MainScreen.modeToString[this.mode]}`;

  const world_invasion = WorldInvasion.GetInstance();
  const num_invaders = world_invasion.num_invaders;
  const num_cities = world_invasion.sorted_cities_codes.length;
  const flasher = world_invasion.flasher;
  const num_flashed = flasher.getTotalFlashes();
  const cities_complete = flasher.getNumCompleteCities();
  const cities_flashed = flasher.getNumFlashedCities();
  const cities_displayed = this.gallery.num_displayed_cities;
  const invaders_displayed = this.gallery.num_displayed_invaders;
  const completecitiesmsg = this.mode == "missing" ? `incomplete ${num_cities - cities_complete}` : `complete ${cities_complete}`;
  this.scoreReport.text = `Cities: invaded ${num_cities} - displayed ${cities_displayed} - missing  ${num_cities - cities_flashed} - ${completecitiesmsg} \n\nInvaders: total ${num_invaders} - flashed ${num_flashed} - displayed ${invaders_displayed} `;
}

  public saveCurrentFlashes() {
  const world_invasion = WorldInvasion.GetInstance();
  const flasher = world_invasion.flasher;
  const fileflash = flasher.getFlashFile();
  this.savedFlashed = fileflash;
}

  public restoreFlashes() {
  const world_invasion = WorldInvasion.GetInstance();
  const flasher = world_invasion.flasher;
  flasher.init(this.savedFlashed);
  this.gallery.layout();
}

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
  this.gallery.layout();
}

  /** Show screen with animations */
  public async show(): Promise < void> {
  const elementsToAnimate = [
    this.scoreReport,
    this.editButton,
    this.modeButton,
    this.tilesSlider,
  ];

  let finalPromise!: AnimationPlaybackControls;
  for(const element of elementsToAnimate) {
    element.alpha = 0;
    finalPromise = animate(
      element,
      { alpha: 1 },
      { duration: 0.3, delay: 0.75, ease: "backOut" }
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
