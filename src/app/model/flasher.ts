import { Assets } from "pixi.js";
import { FlashFileParser } from "../utils/flashfile.js";
import { WorldInvasion } from "./worldinvasion.js";


export class Flasher {
    public name: string;
    public flashedCities: any;

    constructor(name: string) {
        this.name = name;
        this.flashedCities = {};
    }

    public load() {
        const flashfile = Assets.get(`${this.name}.txt`);
        //  console.log(flashfile);
        if (flashfile) {
            const ff = new FlashFileParser();
            const tokens = ff.decodeString(flashfile);
            const cities: any = {};
            tokens.forEach((si_code: string) => {
                let city_code = si_code.split("_")[0];
                if (!(city_code in cities)) {
                    cities[city_code] = [];
                }
                cities[city_code].push(si_code);

            });
            this.flashedCities = cities;
        }
    }

    public getTotalFlashes(): number {
        var total = 0;
        for (let c in this.flashedCities) {
            total += this.flashedCities[c].length;
        }
        return total;
    }

    public getNumFlashedCities(): number {
        var total = 0;
        for (let c in this.flashedCities) {
            if (this.flashedCities[c].length > 0)
                total++;
        }
        return total;
    }


    public isCityFlashed(city_code: string) {
        return city_code in this.flashedCities && this.flashedCities[city_code].length > 0;
    }

    public isCityFullyFlashed(city_code: string) {
        return city_code in this.flashedCities &&
            (this.flashedCities[city_code].length == WorldInvasion.GetInstance().cities[city_code].num_invaders)
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
        for (let c in this.flashedCities) {
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
