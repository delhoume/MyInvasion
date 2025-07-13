import { Text, Container } from "pixi.js";
import { userSettings } from "../../utils/userSettings";
import { engine } from "../../getEngine";
import { WorldInvasion } from "../../model/worldinvasion";
import { City } from "../../model/city";
import { MouseEdges } from "pixi-viewport";

export class GraphicsCity {
  static tileoffset: number = 2;
  static cityoffset: number = 40;
  constructor() { }

  static BuildCityName(
    name: string,
    num_invaders: number,
    num_flashed_invaders: number,
  ) {
    const text = `${name}: ${num_flashed_invaders} / ${num_invaders}`;
    // if (mode == "missing")
    //   text = `${name}: missing ${num_invaders - num_flashed_invaders} / ${num_invaders}`;
    const gtext = new Text({
      text: text,
      style: { fill: "white", fontSize: 22, fontFamily: "Space Invaders" },
    });
    gtext.position.set(0, 16);
    return gtext;
  }

  //  todo: update city name

  static LayoutInvaders(
    city_code: string,
    starty: number,
    mode: string,
  ): Container {
    // build container
    const matrix = new Container({ label: "matrix" });
    const tpr = userSettings.getTilesPerRow();
    const app = engine();
    const windowWidth = app.screen.width;
    const tile_size = windowWidth / tpr - GraphicsCity.tileoffset;

    let cury = starty;
    let curx = 0;

    const world_invasion = WorldInvasion.GetInstance();
    const city = world_invasion.cities[city_code];
    for (let i = 0; i < city.num_invaders; ++i) {
      const si_code = City.InvaderCode(city_code, i);
      const invader = world_invasion.invader(si_code);

      invader.sprite.visible = showInvader;
      if (!showInvader) continue;
      invader.sprite.position.set(
        curx * (tile_size + GraphicsCity.tileoffset),
        cury * (tile_size + GraphicsCity.tileoffset),
      );
      invader.sprite.width = tile_size;
      invader.sprite.height = tile_size;
      curx++;
      if (curx >= tpr) {
        curx = 0;
        cury++;
      }
    }
    return matrix;
  }

  static IsInvaderVisible(mode: string, si_code: string): boolean {
    const city_code = si_code.split("_")[0];
    if (City.IsCityVisible(mode, city_code))  {
          const world_invasion = WorldInvasion.GetInstance();
      switch(mode) {
        case "flashedonly": return world_invasion.flasher.isInvaderFlashed(si_code);
        case "missing":   return !world_invasion.flasher.isInvaderFlashed(si_code);
        case "fullcity": return true;
        case "all": return true;
      }
    }
    return false;
  }
}