import { FancyButton, Slider } from "@pixi/ui";
import { animate } from "motion";
import type { AnimationPlaybackControls } from "motion/react";
import type { Ticker } from "pixi.js";
import {
  Container,
  Graphics,
  NineSliceSprite,
  Point,
  Sprite,
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

import { generateQrCodeMatrix, generateQrCodeImage } from 'dfts-qrcode';

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

  private newButton: FancyButton;
  private importButton: FancyButton;
  private exportButton: FancyButton;
  private modeButton: FancyButton;
  private tilesSlider: Slider;
  private gallery: Gallery;

  public static DefaultMode: string = "flashable";
  private mode: string = MainScreen.DefaultMode; // "all", "flashable', "missing", "flashedonly", "fullcity"
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
    const xoffset = 5;
    const yoffset = 5;
    const modewidth = (UIwidth - 3 * xoffset) / 2;
    const editwidth = modewidth;
    const buttonstarty = 80;
    const buttonheight = 24;
    const buttonrowheight = buttonheight + 10;
    const subeditbuttonwidth = (editwidth - xoffset) / 2;
    const subeditthreebuttonwidth = (editwidth - xoffset * 2) / 3;

    const modeText = new Text({ text: "Mode", style: buttonsStyle });
    this.modeButton = new FancyButton({
      text: modeText,
      defaultView: "ninesplicebutton.png",
      pressedView: "ninesplicebuttonblack.png",
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
      disabledView: "ninesplicebuttongrey.png",
      pressedView: "ninesplicebuttonblack.png",
      nineSliceSprite: [12, 12, 12, 12],
    });
    this.editButton.anchor.set(0);
    this.editButton.position.set(2 * xoffset + modewidth, buttonstarty);
    this.editButton.width = modewidth;
    this.editButton.height = buttonheight;

    this.infoArea.addChild(this.editButton);
    this.editButton.onPress.connect(() => {
      if (this.editMode) return;
      this.saveCurrentFlashes();
      this.setEditMode(true);
      this.updateScore();
    });

    const newText = new Text({ text: "New", style: buttonsStyle });
    this.newButton = new FancyButton({
      text: newText,
      defaultView: "ninesplicebutton.png",
      pressedView: "ninesplicebuttonblack.png",
      nineSliceSprite: [12, 12, 12, 12],
    });
    this.newButton.width = subeditthreebuttonwidth;
    this.newButton.height = buttonheight;
    this.newButton.position.set(
      this.modeButton.x,
      buttonstarty + buttonrowheight
    );
    this.newButton.anchor.set(0);
    this.infoArea.addChild(this.newButton);
    const defaultContents = "# pseudo:Sample test flashfile\n# date: 2025-07-22\nAMI_01+15 BAB_01+30 FTBL_10 12+ 15+5 PA_500 PA_1000 PA_1500+45";

    this.newButton.onPress.connect(() => {
      this.loadFlashfileContents(defaultContents);
    });

    const importText = new Text({ text: "Import", style: buttonsStyle });
    this.importButton = new FancyButton({
      text: importText,
      defaultView: "ninesplicebutton.png",
      pressedView: "ninesplicebuttonblack.png",
      nineSliceSprite: [12, 12, 12, 12],
    });
    this.importButton.width = subeditthreebuttonwidth;
    this.importButton.height = buttonheight;
    this.importButton.position.set(
      this.modeButton.x + subeditthreebuttonwidth + xoffset,
      buttonstarty + buttonrowheight
    );
    this.importButton.anchor.set(0);

    this.infoArea.addChild(this.importButton);

    const filereader = new FileReader();
    const inputElement = document.getElementById("fileElem");

    inputElement.onchange = function (event) {
      filereader.readAsText(event.target.files[0]);
    }
    filereader.onload = function () {
      const contents = filereader.result;
      t.loadFlashfileContents(contents);
    }
    this.importButton.onPress.connect(() => {
      document.getElementById("fileElem")?.click();
    });

    const exportText = new Text({ text: "export", style: buttonsStyle });
    this.exportButton = new FancyButton({
      text: exportText,
      defaultView: "ninesplicebutton.png",
      pressedView: "ninesplicebuttonblack.png",
      disabledView: "ninesplicebuttongrey.png",
      nineSliceSprite: [12, 12, 12, 12]
    });
    this.exportButton.width = subeditthreebuttonwidth;
    this.exportButton.height = buttonheight;
    this.exportButton.position.set(
      this.modeButton.x + 2 * (subeditthreebuttonwidth + xoffset),
      buttonstarty + buttonrowheight
    );
    this.exportButton.anchor.set(0);

    this.infoArea.addChild(this.exportButton);
    this.exportButton.onPress.connect(() => {
      const world_invasion = WorldInvasion.GetInstance();
      const flasher = world_invasion.flasher;
      const contents = flasher.getFlashFile();

      // also download as text
      const a = document.createElement('a');

      // set up a data uri with the text
      a.href = `data:text/plain,${contents}`;

      // set the download attribute so it downloads and uses this as a filename
      a.download = `${world_invasion.flasher.getProperty("pseudo")}_flashfile_export.txt`;

      // stick it in the document
      document.body.appendChild(a);

      // click it
      a.click();
      document.body.removeChild(a);
      //s and display as qrcode
      const qrcodeMatrix = generateQrCodeMatrix(contents, { mode: 'octet' });
      const cont = new Container();
      const texture = Texture.WHITE;
      const twidth = 5;
      const theight = 5;
      const msize = qrcodeMatrix.length;
      cont.addChild(new Graphics().rect(0, 0, (msize + 2) * twidth, (msize + 2) * theight).fill({ color: "white" }));
      for (let y = 0; y < msize; ++y) {
        const row = qrcodeMatrix[y];
        for (let x = 0; x < row.length; ++x) {
          if (row[x] == 1) {
            const sprite = new Sprite(texture);
            sprite.tint = "0x000000";
            sprite.position.set((x + 1) * twidth, (y + 1) * theight);
            sprite.width = twidth;
            sprite.height = theight;
            cont.addChild(sprite);
          }
        }
      }
      cont.cacheAsTexture(true);
      const bakedtexture = engine().renderer.generateTexture(cont);
      const nsprite = new Sprite(bakedtexture);
      const xpos = (engine().screen.width - nsprite.width) / 2;
      const ypos = (engine().screen.height - nsprite.height) / 2;
      nsprite.position.set(xpos, ypos);
      nsprite.eventMode = "static";
      nsprite.on("pointerup", () => { nsprite.destroy(); });
      this.addChild(nsprite);
    });

    const doneText = new Text({ text: "Done", style: buttonsStyle });
    this.doneButton = new FancyButton({
      text: doneText,
      defaultView: "ninesplicebutton.png",
      pressedView: "ninesplicebuttonblack.png",
      disabledView: "ninesplicebuttongrey.png",
      nineSliceSprite: [12, 12, 12, 12],
    });
    this.doneButton.width = subeditbuttonwidth;
    this.doneButton.height = buttonheight;
    this.doneButton.position.set(
      this.editButton.x,
      buttonstarty + buttonrowheight
    );
    this.doneButton.anchor.set(0);
    this.doneButton.enabled = false;

    this.infoArea.addChild(this.doneButton);
    this.doneButton.onPress.connect(() => {
      this.setEditMode(false);
    });

    const cancelText = new Text({ text: "Cancel", style: buttonsStyle });
    this.cancelButton = new FancyButton({
      text: cancelText,
      defaultView: "ninesplicebutton.png",
      pressedView: "ninesplicebuttonblack.png",
      disabledView: "ninesplicebuttongrey.png",
      nineSliceSprite: [12, 12, 12, 12]
    });

    this.cancelButton.width = subeditbuttonwidth;
    this.cancelButton.height = buttonheight;
    this.cancelButton.position.set(
      this.doneButton.x + this.doneButton.width + xoffset,
      buttonstarty + buttonrowheight
    );
    this.infoArea.addChild(this.cancelButton);
    this.cancelButton.enabled = false;
    this.cancelButton.onPress.connect(() => {
      this.restoreFlashes();
      this.setEditMode(false);
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
          this.mode = "flashable";
          break;
        case "flashable":
          this.mode = "missing";
          break;
      }
      this.gallery.setMode(this.mode);
      this.updateScore();
    });
    //this.gallery.updateAllSprites();
    this.updateScore();
    this.gallery.layout();
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

  public setEditMode(value: boolean) {
    this.editButton.enabled = !value;
    this.doneButton.enabled = value;
    this.cancelButton.enabled = value;
    this.editMode = value;
    this.gallery.setEditMode(value);
  }

  public capitalize(str: string) {
    return str[0].toUpperCase() + str.slice(1);
  }


  static modeToString: any = {
    flashedonly: "Flashed",
    all: "All",
    // fullcity: "Complete cities",
    missing: "Not Flashed",
    flashable: "Flashable"
  }

  public updateScore() {
    this.modeButton.text = `${MainScreen.modeToString[this.mode]}`;

    const world_invasion = WorldInvasion.GetInstance();
    const num_invaders = world_invasion.num_invaders;
    const num_cities = world_invasion.sorted_cities_codes.length;
    const flasher = world_invasion.flasher;
    const num_flashed_invaders = flasher.getTotalFlashes();
    const num_not_flashed_invaders = num_invaders - num_flashed_invaders;
    const num_flashable_invaders  = world_invasion.getNumFlashableInvaders();
    const cities_complete = flasher.getNumCompleteCities();
    const cities_flashed = flasher.getNumFlashedCities();
    const num_flashable_cities = world_invasion.getNumFlashableCities();
    const pseudo = "pseudo" in flasher.properties ? flasher.properties["pseudo"] : "Anonymous";
    document.title = `MyInvasion: ${pseudo}`
    var scoretext = pseudo;
    if ("date" in flasher.properties)
      scoretext += `  ${flasher.properties["date"]}`;
    if ("rank" in flasher.properties)
      scoretext += `  rank ${flasher.properties["rank"]}`;
    const citiesmsgcommon = `Cities: invaded ${num_cities} `;
    var citiesmsg : string = "";
    switch (this.mode) {
      case "all":
        case "flashedonly":
          citiesmsg = `flashed: ${cities_flashed} - complete: ${cities_complete}`; break;
      case "missing":
        citiesmsg = `incomplete ${num_cities - cities_complete}`; break;
      case "flashable":
        citiesmsg = `flashable: ${num_flashable_cities}`; break;
    }
      (this.mode == "missing" || this.mode == "flashable")
        ? `incomplete ${num_cities - cities_complete}`
        : `complete ${cities_complete}`;
    const invadersmsgcommon = `Invaders: total ${num_invaders}`;
    var invadersmsg: string = "";
    switch (this.mode) {
      case "missing":
        invadersmsg = ` not flashed: ${num_not_flashed_invaders}`; break;
      case "flashable":
        invadersmsg = ` flashable: ${num_flashable_invaders}`; break;
      case "flashedonly":
        invadersmsg = ` flashed: ${num_flashed_invaders}`; break;
      }
    this.scoreReport.text = `${scoretext} \n\n ${citiesmsgcommon} - ${citiesmsg} \n\n ${invadersmsgcommon} - ${invadersmsg} `;
  }
  public loadFlashfileContents(contents: string) {
    const world_invasion = WorldInvasion.GetInstance();
    const flasher = new Flasher(contents);
    world_invasion.initFromFlasher(flasher);
    this.gallery.updateAllSprites();
    this.updateScore();
    this.gallery.layout();
  }

  public saveCurrentFlashes() {
    const world_invasion = WorldInvasion.GetInstance();
    const flasher = world_invasion.flasher;
    const fileflash = flasher.getFlashFile();
    this.savedFlashed = fileflash;
  }

  public restoreFlashes() {
    const world_invasion = WorldInvasion.GetInstance();
    const flasher = new Flasher(this.savedFlashed);
    world_invasion.initFromFlasher(flasher);
    this.updateScore();
    this.gallery.layout();
  }

  /** Update the screen */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public update(_time: Ticker) {
    //   this.gallery.update();
    this.updateScore();
  }

  /** Fully reset */
  public reset() { }

  /** Resize the screen, fired whenever window size changes */
  public resize(width: number, height: number) {
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
