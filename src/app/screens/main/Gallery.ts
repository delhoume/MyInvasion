import { GraphicsCity } from "./GraphicsCity";
import { Assets, Container, Sprite } from "pixi.js";
import { Camera, Shake } from "pixi-game-camera";
import { engine } from "../../getEngine";
import { WorldInvasion } from "../../model/worldinvasion";
import { SpaceInvader } from "../../model/spaceinvader";
import { City } from "../../model/city";
import { userSettings } from "../../utils/userSettings";
import { MainScreen } from "./MainScreen";

export class Gallery extends Container {
  private camera: Camera;
  private firstShake: Shake | undefined;
  public mode: string = MainScreen.DefaultMode;
  static shake_intensity: number = 6;
  static shake_duration: number = 500;
  public num_displayed_cities: number = 0;
  public num_displayed_invaders: number = 0;


  constructor() {
    super({ label: "Gallery" });

    this.camera = new Camera({
      ticker: engine().ticker,
    });
  }

  setMode(mode: string) {
    this.mode = mode;
    // update all texts (done in layout)
    this.updateCitiesTexts();
  }

  public initAllGraphics() {
    const world_invasion = WorldInvasion.GetInstance();
    for (const c in world_invasion.cities) {
      const city = world_invasion.cities[c];
      const cityContainer = new Container({ label: c });
      const cityHeaderContainer = new Container({ label: `${c}_header` });
      cityHeaderContainer.addChild(
        GraphicsCity.BuildCityName(
          city.name,
          city.invaders,
          world_invasion.flasher.getCityFlashedNum(c),
        ),
      );
      const cityInvadersContainer = new Container({ label: `${c}_invaders` });
      cityContainer.addChild(cityHeaderContainer, cityInvadersContainer);
      for (let i = 0; i < city.num_invaders; ++i) {
        const invader = world_invasion.invader(City.InvaderCode(c, i));
        cityInvadersContainer.addChild(invader.sprite);
      }
      this.addChild(cityContainer);
      this.updateCityText(c);
    }
  }
  public startShaking() {
    this.firstShake = undefined;
    const containers = this.getChildrenByLabel(/_invaders/, true);
    containers.forEach((container) => {
      const shake = new Shake(
        container,
        Gallery.shake_intensity,
        Gallery.shake_duration,
      );
      if (this.firstShake == undefined) this.firstShake = shake;
      this.camera.effect(shake);
    });
  }

  public stopShaking() {
    this.firstShake = undefined;
  }

  public restartShake() {
    if (this.firstShake?.criteriaMet()) {
      //      console.log("called");
      this.startShaking();
    }
  }

  // future : start nlayout from a given city
  // currenty layout the whole thing again (fast enough)...
  public layout() {
    // gcompute tilesize
    const tpr = userSettings.getTilesPerRow();
    const app = engine();
    const windowWidth = app.screen.width;
    const tilesize = (windowWidth - (tpr + 1) * GraphicsCity.tileoffset) / tpr;
    const world_invasion = WorldInvasion.GetInstance();
    let cy = 0;
    this.num_displayed_cities = 0;
    this.num_displayed_invaders = 0;

    for (let c = 0; c < world_invasion.sorted_cities_codes.length; ++c) {
      const city_code = world_invasion.sorted_cities_codes[c];
      const city = world_invasion.cities[city_code];
      const cityContainer = this.getChildByLabel(city_code);
      if (!cityContainer) continue;
      cityContainer.visible = City.IsCityVisible(this.mode, city_code);
      if (!cityContainer.visible) {
        continue;
    }
      this.num_displayed_cities++;
      cityContainer.position.set(0, cy);
      const cityHeaderContainer = cityContainer.getChildByLabel(
        `${city_code}_header`,
      );
      const cityInvadersContainer = cityContainer.getChildByLabel(
        `${city_code}_invaders`,
      );
      cityHeaderContainer?.position.set(0, 0);

      // does not depend on tilesize
      cy += GraphicsCity.cityoffset;
      cityInvadersContainer?.position.set(0, GraphicsCity.cityoffset);
      let y = 0;
      let x = 0;
      for (let i = 0; i < city.num_invaders; ++i) {
        const invader_code = City.InvaderCode(city_code, i);
        const invader = world_invasion.invader(invader_code);
        const sprite = invader.sprite;

        const isvisibleinvader = GraphicsCity.IsInvaderVisible(this.mode, invader_code);
        sprite.visible = isvisibleinvader;
         if (!isvisibleinvader) continue
        this.num_displayed_invaders++;
       //    console.log(sprite);
        sprite.position.set(
          x * (tilesize + GraphicsCity.tileoffset),
          y * (tilesize + GraphicsCity.tileoffset),
        );
        sprite.width = tilesize;
        sprite.height = tilesize;
        sprite.visible = true;
        x++;
        if (x >= tpr) {
          x = 0;
          y++;
        }
      }
      cy += (y + 1) * (tilesize + GraphicsCity.tileoffset);
    }
  }

  public updateCitiesTexts() {
    const world_invasion = WorldInvasion.GetInstance();
    const allcities = world_invasion.sorted_cities_codes;
    allcities.map((city_code: string) => this.updateCityText(city_code));
  }

  public updateCityText(city_code: string) {
    const world_invasion = WorldInvasion.GetInstance();
    const city = world_invasion.cities[city_code];
    const cityContainer = this.getChildByLabel(city_code);
    const cityHeaderContainer = cityContainer?.getChildByLabel(
      `${city_code}_header`,
    );
    const citytext = cityHeaderContainer?.getChildAt(0);
    const num_invaders = city.num_invaders;
    const num_flashed = world_invasion.flasher.isCityFlashed(city_code)
      ? world_invasion.flasher.flashedCities[city_code].length
      : 0;
    const isInMissingMode = this.mode == "missing";
    const ttext = `${city.name}: ${this.mode == "missing" ? "missing" : ""} ${isInMissingMode ? num_invaders - num_flashed : num_flashed} / ${num_invaders}`;
    if (citytext && "text" in citytext) {
      (citytext as { text: any; Text }).text = ttext.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }
  }

  public toggleFlashed(si: SpaceInvader) {
    if (!this.firstShake)
      // not in edit mode
      return;
    const world_invasion = WorldInvasion.GetInstance();
    const flasher = world_invasion.flasher;
    const flashed = flasher.isInvaderFlashed(si.code);
    if (flashed) {
      flasher.unflash(si.code);
    } else {
      const tutulululu = Assets.get("tutulululu.mp3");
      tutulululu.play();
      flasher.flash(si.code);
    }
    const oldSprite = si.sprite;
    const newSprite: Sprite = SpaceInvader.BuildSprite(
      si.code,
      si.state,
      !flashed,
    );
    const parent = oldSprite.parent;
    newSprite.position = oldSprite.position;
    newSprite.width = oldSprite.width;
    newSprite.height = oldSprite.height;
    parent.removeChild(<Sprite>oldSprite);
    parent.addChild(newSprite);
    si.sprite = newSprite;
    newSprite.on("pointerup", () => {
      this.toggleFlashed(si);
    });
    this.updateCityText(si.city_code);
    if (this.mode != "all") {
      this.layout();
    }
  }

  public remove(): void { }

  public update(): void {
    this.restartShake();
  }

  public resize(): void { }
}
