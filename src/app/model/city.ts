import { SpaceInvader } from "./spaceinvader";
import { Utils } from "./utils";

export class City {
    public name: string;
    public prefix: string;
    public isocountry: string;
    public num_invaders: number;
    public points: number;
    public waves: number = 0;
    public start: number = 1;
    public invaders: any = {}
    public sorted_names = [];


    constructor(params: any) {
        this.name = params.name;
        this.prefix = params.prefix;
        this.isocountry = params.iso;
        this.num_invaders = params.invaders;
        this.points = params.pts;
    
        for (let i = 0; i < this.num_invaders; ++i) {
             const invader_code = City.InvaderCode(this.prefix, i);
            this.invaders[invader_code] = new SpaceInvader(invader_code);
        }
    }
    
    static InvaderCode(city_code: string, order: number) : string {
         if (city_code != "LIL")
            order++;
       return `${city_code}_${Utils.InvaderFormat(order)}`;
    }
}
