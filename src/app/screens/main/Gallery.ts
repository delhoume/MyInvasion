import { GraphicsCity } from "./GraphicsCity";
import { Assets, Container } from "pixi.js";
import { Camera, Shake } from "pixi-game-camera";
import { engine } from "../../getEngine";
import { WorldInvasion } from "../../model/worldinvasion";
import { SpaceInvader } from "../../model/spaceinvader";
import { City } from "../../model/city";
import { userSettings } from "../../utils/userSettings";
import { Sound } from '@pixi/sound';

export class Gallery extends Container {
  private camera: Camera;
  private firstShake: any;
  public mode: string = "flashed";
  static shake_intensity: number = 6;
  static shake_duration: number = 500;


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
    for (let c in world_invasion.cities) {
      const city = world_invasion.cities[c];
      const cityContainer = new Container({ label: c });
      const cityHeaderContainer = new Container({ label: `${c}_header` });
      cityHeaderContainer.addChild(GraphicsCity.BuildCityName(city.name, city.invaders,
        world_invasion.flasher.getCityFlashedNum(c)));
      const cityInvadersContainer = new Container({ label: `${c}_invaders` });
      cityContainer.addChild(cityHeaderContainer, cityInvadersContainer);
      for (let i = 0; i < city.num_invaders; ++i) {
        const invader = world_invasion.invader(City.InvaderCode(c, i));
        cityInvadersContainer.addChild(invader.sprite);
      }
      this.addChild(cityContainer)
      this.updateCityText(c);

    }
  }
  public startShaking() {
    this.firstShake = undefined;
    const containers = this.getChildrenByLabel(/_invaders/, true)
    containers.forEach((container) => {
      let shake = new Shake(container, Gallery.shake_intensity, Gallery.shake_duration);
      if (this.firstShake == undefined)
        this.firstShake = shake;
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
  public layout(start_city_code: string | null) {
    // gcompute tilesize
    const tpr = userSettings.getTilesPerRow();
    const app = engine();
    const windowWidth = app.screen.width;
    const tilesize = (windowWidth - ((tpr + 1) * GraphicsCity.tileoffset)) / tpr;
    const world_invasion = WorldInvasion.GetInstance();
    var cy = 0;
    let found_start: boolean= false;

    for (let c = 0; c < world_invasion.sorted_cities_codes.length; ++c) {
      const city_code = world_invasion.sorted_cities_codes[c];
      found_start = start_city_code && start_city_code == city_code;
           const city = world_invasion.cities[city_code];
      const cityContainer = this.getChildByLabel(city_code);

      if (this.mode == "flashed" && !world_invasion.flasher.isCityFlashed(city_code)) {
        cityContainer.visible = false;
        continue;
      }
      if (this.mode == "missing" && world_invasion.flasher.isCityFullyFlashed(city_code)) {
        cityContainer.visible = false;
        continue;
      }
      cityContainer.visible = true;
      cityContainer.position.set(0, cy);
      const cityHeaderContainer = cityContainer.getChildByLabel(`${city_code}_header`);
      const cityInvadersContainer = cityContainer.getChildByLabel(`${city_code}_invaders`);
      cityHeaderContainer.position.set(0, 0);

      // does not depend on tilesize
      cy += GraphicsCity.cityoffset;
      cityInvadersContainer.position.set(0, GraphicsCity.cityoffset);
      var y = 0;
      var x = 0;
      for (let i = 0; i < city.num_invaders; ++i) {
        const invader_code = City.InvaderCode(city_code, i);
        const invader = world_invasion.invader(invader_code);
        const sprite = invader.sprite;

        if ((world_invasion.flasher.isInvaderFlashed(invader_code) == false && this.mode == "flashed") ||
          (world_invasion.flasher.isInvaderFlashed(invader_code) == true && this.mode == "missing")) {
          sprite.visible = false;
          continue;
        }
        sprite.visible = true;
        //    console.log(sprite);
        sprite.position.set(x * (tilesize + GraphicsCity.tileoffset), y * (tilesize + GraphicsCity.tileoffset));
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
    const cityHeaderContainer = cityContainer.getChildByLabel(`${city_code}_header`);
    const citytext = cityHeaderContainer.getChildAt(0);
    const num_invaders = city.num_invaders;
    const num_flashed = world_invasion.flasher.isCityFlashed(city_code) ?
      world_invasion.flasher.flashedCities[city_code].length : 0;
    if (this.mode == "missing") {
      citytext.text = `${city.name}: missing ${num_invaders - num_flashed} / ${num_invaders}`;
    } else {
      citytext.text = `${city.name}:  ${num_flashed} / ${num_invaders}`;
    }
  }

  public toggleFlashed(si: SpaceInvader) {
    if (!this.firstShake) // not in edit mode
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
    var oldSprite = si.sprite;
    var newSprite: Sprite = SpaceInvader.BuildSprite(si.code, si.state, !flashed);
    const parent = oldSprite.parent;
    newSprite.position = oldSprite.position;
    newSprite.width = oldSprite.width;
    newSprite.height = oldSprite.height;
    parent.removeChild(<Sprite>oldSprite);
    parent.addChild(newSprite);
    si.sprite = newSprite;
    newSprite.on('pointerup', (_) => {
      this.toggleFlashed(si);
    });
    this.updateCityText(si.city_code);
    if (this.mode != "all") {
      this.layout(si.city_code);
    }

  }

  public remove(): void { }

  public update(): void {
    this.restartShake();
  }

  public resize(w: number, h: number): void {
  }
}
