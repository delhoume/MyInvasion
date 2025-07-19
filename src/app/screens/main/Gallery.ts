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
import { CheckBox } from "@pixi/ui";

export class Gallery extends Container {
  private camera: Camera;
  private firstShake: Shake | undefined;
  public mode: string = MainScreen.DefaultMode;
  public editmode: boolean = false;
  static ShakeIntensity: number = 2;
  static ShakeDuration: number = 500;
  public num_displayed_cities: number = 0;
  public num_displayed_invaders: number = 0;
  private viewport: Viewport;
  static Sizecheck: number = 15;
  constructor(viewport: Viewport) {
    super({ label: "Gallery" });
    this.viewport = viewport;
    this.camera = new Camera({
      ticker: engine().ticker,
    });
  }

  setMode(mode: string) {
    this.mode = mode;
    this.layout();
    this.updateCitiesTexts();
  }

  public setEditMode(editmode: boolean) {
    this.editmode = editmode;
    this.updateAllSprites();
    this.updateCitiesTexts()
    this.layout();

    if (editmode)
      this.startShaking();
    else
      this.stopShaking();
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
          world_invasion.flasher.getCityFlashedNum(c)
        )
      );
      const cityInvadersContainer = new Container({ label: `${c}_invaders` });
      cityContainer.addChild(cityHeaderContainer, cityInvadersContainer);
      for (let i = 0; i < city.num_invaders; ++i) {
        const invader_code = City.InvaderCode(c, i);
        const invader = world_invasion.invader(invader_code);
        const flashed = world_invasion.flasher.isInvaderFlashed(invader_code);
        const texture: Texture = SpaceInvader.BuildTexture(
          invader_code,
          invader.state,
          flashed, this.mode,
          this.editmode
        );
        const sprite = new Sprite(texture);
        sprite.label = invader_code;
        invader.sprite = sprite;
        sprite.eventMode = "static";
        sprite.on("pointerup", () => {
          this.toggleFlashed(invader_code);
          this.updateCityText(c);
          this.updateSprite(invader_code);
          this.layout();
        });
        cityInvadersContainer.addChild(invader.sprite);
        // create checkbox (in progress)
        // invader.checkbox = new CheckBox({
        //   style: { checked: "checked.png", unchecked: "unchecked.png" },
        // });
        // cityInvadersContainer.addChild(invader.checkbox);
      }
      this.addChild(cityContainer);
    }
    this.updateCitiesTexts();
  }

  public startShaking() {
    this.firstShake = undefined;
    const containers = this.getChildrenByLabel(/_invaders/, true);
    containers.forEach((container) => {
      const shake = new Shake(
        container,
        Gallery.ShakeIntensity,
        Gallery.ShakeDuration
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
    const ratio =
      (tpr - MainScreen.MinTilesPerRow) /
      (MainScreen.MaxTilesPerRow - MainScreen.MinTilesPerRow);
    const mintileoffset = 20; // GraphicsCity.cityoffset / 3;
    const maxtileoffset = 30; // GraphicsCity.cityoffset;
    const minfontsize = 8;
    const maxfontsize = 18;
    const computed_offset =
      mintileoffset +
      Math.abs((1.0 - ratio) * (maxtileoffset - mintileoffset)) +
      10;
    const computed_font_size =
      minfontsize + (1.0 - ratio) * (maxfontsize - minfontsize);

    const world_invasion = WorldInvasion.GetInstance();
    let cy = 0;
    this.num_displayed_cities = 0;
    this.num_displayed_invaders = 0;

    for (let c = 0; c < world_invasion.sorted_cities_codes.length; ++c) {
      const city_code = world_invasion.sorted_cities_codes[c];
      const city = world_invasion.cities[city_code];
      const cityContainer = this.getChildByLabel(city_code);
      if (!cityContainer) continue;
      const flasher = world_invasion.flasher;
      const iscitydisplayed = City.IsCityVisible(this.mode, city_code, flasher);
      cityContainer.visible = iscitydisplayed;
      if (iscitydisplayed) {
        this.num_displayed_cities++;
        cityContainer.position.set(0, cy);
        const cityHeaderContainer = cityContainer.getChildByLabel(
          `${city_code}_header`
        );
        const cityInvadersContainer = cityContainer.getChildByLabel(
          `${city_code}_invaders`
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
          const check = invader.checkbox;
          if (x >= tpr) {
            x = 0;
            y++;
            cy += tilesize + GraphicsCity.tileoffset;
          }
          const isvisibleinvader = GraphicsCity.IsInvaderVisible(
            this.mode,
            invader_code
          );
          sprite.visible = isvisibleinvader;
          if (check) {
            check.visible = sprite.visible && this.editmode;
          }
          if (isvisibleinvader) {
            this.num_displayed_invaders++;
            sprite.position.set(
              x * (tilesize + GraphicsCity.tileoffset),
              y * (tilesize + GraphicsCity.tileoffset)
            );
            sprite.width = tilesize;
            sprite.height = tilesize;
            // checkbox

            if (check && this.editmode) {
              const pos = sprite.position;
              check.position.set(pos.x + 5, pos.y + sprite.height - Gallery.Sizecheck - 5);
              check.setSize(Gallery.Sizecheck, Gallery.Sizecheck);
            }
            x++;
          }
        }
        cy += tilesize + GraphicsCity.tileoffset + computed_offset;
      }
    }
    // restore location
    this.viewport.top = pos * this.viewport.worldHeight;
  }

  public updateCityFontSize(
    city_header_container: any,
    computed_font_size: number
  ) {
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
      `${city_code}_header`
    );
    const citytext = cityHeaderContainer?.getChildAt(0);
    const num_invaders = city.num_invaders;
    const num_flashed = world_invasion.flasher.isCityFlashed(city_code)
      ? world_invasion.flasher.flashedCities[city_code].length
      : 0;
    var ttext = `${city.name}: flashed ${num_flashed} / ${num_invaders}`;
    if (this.mode == "missing") {
      ttext = `${city.name}: missing ${num_invaders - num_flashed} / ${num_invaders}`;
    } else if (this.mode == "flashable") {
      const num_flashable = City.GetFlashableNum(
        city_code,
        world_invasion.flasher
      );

      ttext = `${city.name}: missing ${num_invaders - num_flashed} / flashable ${num_flashable}`;
    }

    if (citytext && "text" in citytext) {
      (citytext as { text: any; Text }).text = ttext
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
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
      this.mode,
      this.editmode
    );
    si.sprite.texture = newTexture;
    if (si.checbox) {
      si.checkbox.checked = flasher.isInvaderFlashed(si_code);
    }
  }
}
