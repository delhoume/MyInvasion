import { GraphicsCity } from "./GraphicsCity";
import { Assets, Container, Sprite, Texture } from "pixi.js";
import { Camera, Shake } from "pixi-game-camera";
import { engine } from "../../getEngine";
import { WorldInvasion } from "../../model/worldinvasion";
import { SpaceInvader } from "../../model/spaceinvader";
import { City } from "../../model/city";
import { userSettings } from "../../utils/userSettings";
import { MainScreen } from "./MainScreen";
import { Viewport } from "pixi-viewport";
import { Flasher } from "../../model/flasher";

export class Gallery extends Container {
  private camera: Camera;
  private firstShake: Shake | undefined;
  public mode: string = MainScreen.DefaultMode;
  static shake_intensity: number = 6;
  static shake_duration: number = 500;
  public num_displayed_cities: number = 0;
  public num_displayed_invaders: number = 0;
  private viewport: Viewport;

  constructor(viewport: Viewport) {
    super({ label: "Gallery" });
    this.viewport = viewport;
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
          city.num_invaders,
          world_invasion.flasher.getCityFlashedNum(c),
        ),
      );
      const cityInvadersContainer = new Container({ label: `${c}_invaders` });
      cityContainer.addChild(cityHeaderContainer, cityInvadersContainer);
      for (let i = 0; i < city.num_invaders; ++i) {
        const invader_code = City.InvaderCode(c, i);
        const invader = world_invasion.invader(invader_code);
        const texture: Texture = SpaceInvader.BuildTexture(invader_code, invader.state,
          world_invasion.flasher.isInvaderFlashed(invader_code));
        const sprite = new Sprite(texture);
        sprite.label = invader_code;
        invader.sprite = sprite;
        sprite.eventMode = "static";
        sprite.on("pointerup", () => {
          this.toggleFlashed(invader_code);
          this.updateCityText(c);
          this.layout();
        });
        this.updateCityText(c);
        cityInvadersContainer.addChild(invader.sprite);
      }
      this.addChild(cityContainer);
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

  // currenty layout the whole thing for each change (fast enough)...
  public layout() {
    // get viewport location
    const pos = this.viewport.top / this.viewport.worldHeight;

    // gcompute tilesize
    const tpr = userSettings.getTilesPerRow();
    const app = engine();
    const windowWidth = app.screen.width;
    const tilesize = (windowWidth - (tpr + 1) * GraphicsCity.tileoffset) / tpr;
    const ratio = (tpr - MainScreen.MinTilesPerRow) / (MainScreen.MaxTilesPerRow - MainScreen.MinTilesPerRow);
    const mintileoffset = 10; // GraphicsCity.cityoffset / 3;
    const maxtileoffset = 30; // GraphicsCity.cityoffset;
    const minfontsize = 8;
    const maxfontsize = 10;
    const computed_offset = mintileoffset + ((1.0 - ratio) * (maxtileoffset - mintileoffset));
    const computed_font_size = minfontsize + ((1.0 - ratio) * (maxfontsize - minfontsize));

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
      this.updateCityFontSize(cityHeaderContainer, computed_font_size);
      // does not depend on tilesize
      // cy += computed_offset;
      cityInvadersContainer?.position.set(0, computed_offset);

      let y = 0;
      let x = 0;
      for (let i = 0; i < city.num_invaders; ++i) {
        const invader_code = City.InvaderCode(city_code, i);
        const invader = world_invasion.invader(invader_code);
        const sprite = invader.sprite;

        if (x >= tpr) {
          x = 0;
          y++;
        }
        const isvisibleinvader = GraphicsCity.IsInvaderVisible(this.mode, invader_code);
        sprite.visible = isvisibleinvader;
        if (!isvisibleinvader) continue
        this.num_displayed_invaders++;
        sprite.position.set(
          x * (tilesize + GraphicsCity.tileoffset),
          y * (tilesize + GraphicsCity.tileoffset));
        sprite.width = tilesize;
        sprite.height = tilesize;
        sprite.visible = true;
        x++;
      }
      cy += (y + 1) * (tilesize + GraphicsCity.tileoffset) + computed_offset;
    }
    // restore location
    this.viewport.top = pos * this.viewport.worldHeight;
  }

  public updateCityFontSize(city_header_container: any, computed_font_size: number) {
    const citytext: Text = city_header_container?.getChildAt(0);
    citytext.style.fontSize = computed_font_size;
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
    var ttext = `${city.name}: ${num_flashed} / ${num_invaders}`;
    if (this.mode == "missing") {
      ttext = `${city.name}: missing ${num_invaders - num_flashed} / ${num_invaders}`;
    }

    if (citytext && "text" in citytext) {
      (citytext as { text: any; Text }).text = ttext.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }
  }

  public toggleFlashed(si_code: string) {
    if (!this.firstShake)
      // not in edit mode
      return;
    const world_invasion = WorldInvasion.GetInstance();
    const flasher = world_invasion.flasher;
    const flashed = flasher.isInvaderFlashed(si_code);
    if (flashed) {
      flasher.unflash(si_code);
    } else {
      const tutulululu = Assets.get("tutulululu.mp3");
      tutulululu.play();
      flasher.flash(si_code);
    }
    this.updateSprite(si_code);
  }

  public remove(): void { }

  public update(): void {
    this.restartShake();
  }

  public resize(): void { }

  public updateAllSprites() {
    const world_invasion = WorldInvasion.GetInstance();
    for (let city_code in world_invasion.cities) {
      for (let si_code in world_invasion.cities[city_code].invaders) {
        this.updateSprite(si_code);
      }
    }
  }


  public updateSprite(si_code: string) {
    const world_invasion = WorldInvasion.GetInstance();
    const flasher = world_invasion.flasher;
    const si = world_invasion.invader(si_code);
    const newTexture = SpaceInvader.BuildTexture(
      si_code,
      si.state,
      flasher.isInvaderFlashed(si_code),
    );
    si.sprite.texture = newTexture;
  }
}