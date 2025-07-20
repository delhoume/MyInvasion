import { Assets } from "pixi.js";
import { SpaceInvader } from "./spaceinvader";
import { Utils } from "./utils";
import { WorldInvasion } from "./worldinvasion";
import { Flasher } from "./flasher";

export class City {
  public name: string;
  public prefix: string;
  public isocountry: string;
  public num_invaders: number;
  public points: number;
  public waves: number = 0;
  public start: number = 1;
  public invaders: any = {};
  public sorted_names = [];
  public flashablenum: number = 0;

  constructor(params: {
    name: string;
    prefix: string;
    iso: string;
    invaders: number;
    pts: number;
  }) {
    this.name = params.name;
    this.prefix = params.prefix;
    this.isocountry = params.iso;
    this.num_invaders = params.invaders;
    this.points = params.pts;

    // will use
       // await fetch(`https://awazleon.space/invaders/${city_code}/city`
    // to: regular polling and automatic updates.
    // same for flasher
    const statuses = Assets.get("invaders.json");
    for (let i = 0; i < this.num_invaders; ++i) {
      const invader_code = City.InvaderCode(this.prefix, i);
      this.invaders[invader_code] = new SpaceInvader(invader_code);
      if (invader_code in statuses && invader_code in this.invaders) {
        if ("status" in statuses[invader_code])
          this.invaders[invader_code].state = statuses[invader_code].status;
        else this.invaders[invader_code].state = "A";
      }
    }
  }

  static InvaderCode(city_code: string, order: number): string {
    if (city_code != "LIL") order++;
    return `${city_code}_${Utils.InvaderFormat(order)}`;
  }

  static IsCityVisible(mode: string, city_code: string, flasher: Flasher): boolean {
    const world_invasion = WorldInvasion.GetInstance();
    switch (mode) {
      case "flashedonly":
        return flasher.isCityFlashed(city_code);
      case "missing":
        return !flasher.isCityFullyFlashed(city_code)
      case "fullcity":
        return flasher.isCityFullyFlashed(city_code);
      case "all":
        return true;
      case "flashable":
        return City.GetFlashableNum(city_code, flasher) > 0;;
    }
    return false;
  }

  // flashable AND not flashed 
  static GetFlashableNum(city_code: string, flasher: Flasher) : number {
    const world_invasion = WorldInvasion.GetInstance();
    if(world_invasion.flasher.isCityFullyFlashed(city_code)) {
      return 0;
    } else {
      var flashable_num = 0;
      for (let city_si = 0; city_si < world_invasion.cities[city_code].num_invaders; city_si++) {
        const si_code = City.InvaderCode(city_code, city_si);
        const invader = world_invasion.invader(si_code);

        if ((invader.state == "A" || invader.state == "DG") &&
          !flasher.isInvaderFlashed(si_code)) {
          ++flashable_num;
        }
      }
      return flashable_num;
    }
  }

}
