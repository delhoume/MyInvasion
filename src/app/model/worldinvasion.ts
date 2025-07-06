import * as fs from 'node:fs';
import { City } from './city';
import { SpaceInvader } from './spaceinvader';
import { Assets } from 'pixi.js';
import { Flasher } from './flasher';
import { GraphicsCity } from '../screens/main/GraphicsCity';
import { engine } from '../getEngine';

export class WorldInvasion {
    public cities: any;
    public num_cities: number;
    public num_invaders: number;
    public sorted_cities_codes: any;
    public flasher: Flasher;
    public sorted_flashed_cities_codes: any;

    private static singleton: WorldInvasion;

    private constructor() {
        this.num_cities = 0;
        this.num_invaders = 0;
        this.cities = {};
    }

    static GetInstance() {
        if (WorldInvasion.singleton)
            return WorldInvasion.singleton;
        WorldInvasion.singleton = new WorldInvasion();
        WorldInvasion.singleton.initFrom(Assets.get("cities.json"));
        WorldInvasion.singleton.initFromFlasher("ninatheo_03_juillet_2025")
        return WorldInvasion.singleton;
    }

    initFrom(desc: any) {
        this.num_cities = desc.cities.number;
        this.num_invaders = 0;
        for (var c in desc.cities.details) {
            const cityObj = desc.cities.details[c];
            var city = new City(cityObj);
            this.num_invaders += city.num_invaders;
            this.cities[c] = city;
        }
        this.sorted_cities_codes = Object.keys(this.cities);
        this.sorted_cities_codes.sort((a: any, b: any) => {
            return this.cities[a].name.localeCompare(
                this.cities[b].name);
        });
    }

    initFromFlasher(flasher_name: string) {
        this.flasher = new Flasher(flasher_name);
        this.flasher.load();
        this.sorted_flashed_cities_codes = [];
        //same order to filter
        for (let c = 0; c < this.sorted_cities_codes.length; ++c) {
            const city_code = this.sorted_cities_codes[c];
            let city = this.cities[city_code];
            if (this.flasher.isCityFlashed(city_code)) {
                this.sorted_flashed_cities_codes.push(city_code);
                for (let si_code in city.invaders) {
                    city.invaders[si_code].flashed = this.flasher.isInvaderFlashed;
                }
            } else {
                for (let si_code in city.invaders) {
                    city.invaders[si_code].flashed = false;
                }
            }

            for (let si_code in city.invaders) {
                const si = city.invaders[si_code];
                if (si) {

                    si.sprite = SpaceInvader.BuildSprite(si_code,
                        "state" in si ? si.state : "U", this.flasher.isInvaderFlashed(si_code));
                    si.sprite.on('pointerup', (event) => {
                        const gallery = engine().stage.getChildByLabel(/Gallery/, true);
                        if (gallery) {
                            gallery.toggleFlashed(si);
                        }
                    });
                } else {
                    console.log("no such:", si_code);
                }
            }
        }
    }

    // https://awazleon.space/cities/info
    initFromFile(filename: string) {
        const contents = fs.readFileSync(filename, { encoding: "utf8" });
        const world_description = JSON.parse(contents);
        this.initFrom(world_description);
    }

    saveToFile(filename: string) {
        // const contents = JSON.stringify(this);
        // console.log(filename, contents);
        console.log(this);
    }

    invader(invader_code: string): SpaceInvader {
        const { city_code, order } = SpaceInvader.CodeToParts(invader_code);
        const city = this.cities[city_code];
        const ret = city.invaders[invader_code];
        return ret;
    }
}