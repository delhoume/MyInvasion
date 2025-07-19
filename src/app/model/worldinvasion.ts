import * as fs from "node:fs";
import { City } from "./city";
import { SpaceInvader } from "./spaceinvader";
import { Assets } from "pixi.js";
import { Flasher } from "./flasher";
import { engine } from "../getEngine";
import { MainScreen } from "../screens/main/MainScreen";

export class WorldInvasion {
  public cities: any;
  public num_cities: number;
  public num_invaders: number;
  public sorted_cities_codes: any;
  public flasher!: Flasher;
  public sorted_flashed_cities_codes: any;

  private static singleton: WorldInvasion;

  private constructor() {
    this.num_cities = 0;
    this.num_invaders = 0;
    this.cities = {};
  }

  static GetInstance() {
    if (WorldInvasion.singleton) return WorldInvasion.singleton;
    WorldInvasion.singleton = new WorldInvasion();
    WorldInvasion.singleton.initFrom(Assets.get("cities.json"));
    //const flasher = new Flasher("pariscmagic_10juillet_2025");;
    const flasher = new Flasher("delhoume_latest");
    flasher.load();
    WorldInvasion.singleton.initFromFlasher(flasher);
    return WorldInvasion.singleton;
  }

  public initFrom(desc: any) {
    this.num_cities = desc.cities.number;
    this.num_invaders = 0;
    for (const c in desc.cities.details) {
      const cityObj = desc.cities.details[c];
      const city = new City(cityObj);
      this.num_invaders += city.num_invaders;
      this.cities[c] = city;
    }
    this.sorted_cities_codes = Object.keys(this.cities);
    this.sorted_cities_codes.sort((a: string, b: string) => {
      return this.cities[a].name.localeCompare(this.cities[b].name);
    });
  }

  public initFromFlasher(flasher: Flasher) {
    this.flasher = flasher;
    this.sorted_flashed_cities_codes = [];
    // TODO handle case where flashed are not in our list
    for (let c in flasher.flashedCities) {
      if (!(c in this.cities)) {
        // create new city with code as name and find higher si for number
        const finvaders = flasher.flashedCities[c];
        var maxnuminv = 0;
        for (let i = 0; i < finvaders.length; i++) {
          const invader_code = finvaders[i];
          const { city_code, order } = SpaceInvader.CodeToParts(invader_code);
          if (order > maxnuminv) maxnuminv = order;
        }
        const newcity = new City({
          prefix: c,
          name: c,
          country: "",
          invaders: maxnuminv,
          pts: 0
        });
        this.cities[c] = newcity;
        this.sorted_cities_codes.push(c);
      }
    }
    //same order to filter
    for (let c = 0; c < this.sorted_cities_codes.length; ++c) {
      const city_code = this.sorted_cities_codes[c];
      const city = this.cities[city_code];
      if (this.flasher.isCityFlashed(city_code)) {
        this.sorted_flashed_cities_codes.push(city_code);
        for (const si_code in city.invaders) {
          city.invaders[si_code].flashed = this.flasher.isInvaderFlashed;
        }
      } else {
        for (const si_code in city.invaders) {
          city.invaders[si_code].flashed = false;
        }
      }

      for (const si_code in city.invaders) {
        const si = city.invaders[si_code];
        if (si) {
          const texture = SpaceInvader.BuildTexture(si_code, "state" in si ? si.state : "U",
                     this.flasher.isInvaderFlashed(si_code), MainScreen.DefaultMode);
          si.sprite.texture = texture;
        }
      }
    }
  }
  // https://awazleon.space/cities/info
  public initFromFile(filename: string) {
    const contents = fs.readFileSync(filename, { encoding: "utf8" });
    const world_description = JSON.parse(contents);
    this.initFrom(world_description);
  }

  // saveToFile(filename?: string) {
  //      const contents = JSON.stringify(this);
  //     console.log(filename, contents);
  //     console.log(this);
  // }

  public invader(invader_code: string): SpaceInvader {
    const { city_code } = SpaceInvader.CodeToParts(invader_code);
    const city = this.cities[city_code];
    const ret = city.invaders[invader_code];
    return ret;
  }
}
