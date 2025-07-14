import { Text, Container } from "pixi.js";
import { WorldInvasion } from "../../model/worldinvasion";
import { City } from "../../model/city";

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