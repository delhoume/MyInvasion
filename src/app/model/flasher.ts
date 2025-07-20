import { Assets, vkFormatToGPUFormat } from "pixi.js";
import { FlashFileParser } from "../utils/flashfile.js";
import { WorldInvasion } from "./worldinvasion.js";

type Comment = { line: number, comment: string };
type Property = { name: string, value: string };


export class Flasher {
  public properties: any = {};
  public flashedCities: any;

  constructor() {
    this.flashedCities = {};
  }

  public init(flashfile: string) {
    if (flashfile) {
      const ff = new FlashFileParser();
      const tokens = ff.decodeString(flashfile);
      // check for special names
      var idx = tokens.indexOf("SPACE2ISS");
      if (idx != -1) tokens[idx] = "SPACE_02";
      const cities: any = {};
      tokens.forEach((si_code: string) => {
        const city_code = si_code.split("_")[0];
        if (!(city_code in cities)) {
          cities[city_code] = [];
        }
        cities[city_code].push(si_code);
      });
      this.flashedCities = cities;
   // console.log(ff.comments);
      this.parseFlashFileComments(ff.comments);
    }
  }

public getProperty(name: string) : string {
  return this.properties[name];
}

public load(name: string) {
    const flashfile = Assets.get(name);
    this.init(flashfile);
  }

public setProperty(name: string, value: string) {
  this.properties[name] =  value;
}

  public parseFlashFileComments(comments: Comment[]) {
    for (let c = 0; c < comments.length; ++c) {
      const comment = comments[c].comment;
      // check if name:value
      const idx = comment.indexOf(":");
      if (idx != -1) {
        const prop = comment.substring(0, idx).trimEnd();
        const value = comment.substring(idx + 1).trimStart();
        this.setProperty(prop, value);
      }
    }
  }

  public getTotalFlashes(): number {
    let total = 0;
    for (const c in this.flashedCities) {
      total += this.flashedCities[c].length;
    }
    return total;
  }

  public getNumFlashedCities(): number {
    let total = 0;
    for (const c in this.flashedCities) {
      if (this.flashedCities[c].length > 0) total++;
    }
    return total;
  }

  public getNumCompleteCities(): number {
    let total = 0;
    for (const c in this.flashedCities) {
      if (
        this.flashedCities[c].length ==
        WorldInvasion.GetInstance().cities[c].num_invaders
      )
        total++;
    }
    return total;
  }

  public isCityFlashed(city_code: string) {
    return (
      city_code in this.flashedCities &&
      this.flashedCities[city_code].length > 0
    );
  }

  public isCityFullyFlashed(city_code: string) {
    return (
      city_code in this.flashedCities &&
      this.flashedCities[city_code].length ==
      WorldInvasion.GetInstance().cities[city_code].num_invaders
    );
  }

  public getCityFlashedNum(city_code: string) {
    if (this.isCityFlashed(city_code)) {
      return this.flashedCities[city_code].length;
    }
    return 0;
  }

  public isInvaderFlashed(si_code: string) {
    const city_code = si_code.split("_")[0];
    if (city_code in this.flashedCities) {
      const flashedCityInvaders = this.flashedCities[city_code];
      //)          console.log(`${city_code} flashed ${flashedCityInvaders}`);
      if (flashedCityInvaders.includes(si_code)) {
        return true;
      }
    }
    return false;
  }

  public flash(si_code: string) {
    const city_code = si_code.split("_")[0];
    if (!(city_code in this.flashedCities)) {
      this.flashedCities[city_code] = [];
    }
    this.flashedCities[city_code].push(si_code);
  }

  public unflash(si_code: string) {
    const city_code = si_code.split("_")[0];
    const invaders = this.flashedCities[city_code];
    const idx = invaders.indexOf(si_code);
    this.flashedCities[city_code].splice(idx, 1);
    // no need to remove the city if empty
  }

  getFlashFile() {
    const tokens: any = [];
    for (const c in this.flashedCities) {
      const invaders = this.flashedCities[c];
      for (let i = 0; i < invaders.length; ++i) {
        tokens.push(invaders[i]);
      }
    }
    const ff = new FlashFileParser();
    const result = ff.encode(tokens);
    return result.join(" ");
  }
}
