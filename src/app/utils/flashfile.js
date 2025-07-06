class FlashFileParser {
    current_city_code;
    constructor() { }

    tokenize(contents) {
        let tokens = [];
        if (contents && contents.length > 0) {
            let lines = contents.split("\n");
            for (let l = 0; l < lines.length; ++l) {
                let line = lines[l];
                let comment_pos = line.indexOf('#');
                if (comment_pos != -1)
                    line = line.substring(0, comment_pos);
                let trick = line.replaceAll(".", " ");
                let words = trick.split(" ");
                for (let w = 0; w < words.length; ++w) {
                    let good_word = words[w].trim();
                    if (good_word.length > 0) {
                        tokens.push(good_word);
                    }
                }
            }
        }
        return tokens;
    }

    decodeString(contents) {
        let tokens = this.tokenize(contents);
        return this.decode(tokens);
    }

    decode(tokens) {
        let current_list = [];
        this.current_city_code = 'PA';
        for (let c = 0; c < tokens.length; ++c) {
            let command = tokens[c];
            if (command.indexOf("_") != -1) {
                let parts = command.split("_");
                this.current_city_code = parts[0];
                this.handleOrderToken(parts[1].trim(), current_list);
            } else {
                this.handleOrderToken(command.trim(), current_list);
            }
        }
        return current_list;

    }

    emitOrderToken(current_span, use_invader_numbers) {
        if (current_span.len == 0) return this.printInvaderNumber(current_span.start, use_invader_numbers);
        else if (current_span.len == 1) return "" + this.printInvaderNumber(current_span.start, use_invader_numbers) + "+";
        else {
            let absolute = this.printInvaderNumber(current_span.start, use_invader_numbers) + "," + this.printInvaderNumber(current_span.start + current_span.len, use_invader_numbers);
            let relative = this.printInvaderNumber(current_span.start, use_invader_numbers) + "+" + current_span.len;
            return relative.length > absolute.length ? absolute : relative;
        }
    }

    emitFullToken(current_span, needs_city = true, use_invader_numbers = true) {
        return (needs_city ? (current_span.city + "_") : "") + this.emitOrderToken(current_span, use_invader_numbers);
    }


    encodeString(contents, keep_order = false) {
        let tokens = this.tokenize(contents);
        return this.encode(tokens, keep_order);
    }

    encode(tokens, keep_order = false, use_invader_numbers = true) {
        let encoded = [];
        if (tokens.length == 0)
            return encoded;
        // split all to allow sorting and fill input structure by city
        let sis = tokens.map((t) => {
            let parts = t.split("_");
            if (parts.length == 2) {
                let city = parts[0];
                let order = parts[1];
                return { city: city, order: Number(order) };
            }
        });
        // if sorting is allowed
        if (keep_order == false) {
            //            console.log("sorting");
            sis.sort((ta, tb) => {
                if (ta.city == tb.city)
                    return ta.order - tb.order;
                else
                    return ta.city.localeCompare(tb.city);
            });
        } else {
            //    console.log("no sorting");
        }
        let current_span = { city: sis[0].city, start: sis[0].order, len: 0 };
        let previous_full_city = "None";
        for (let s = 1; s < sis.length; ++s) {
            let si = sis[s];
            //           console.log("considering", si, current_span.city, current_span.start, current_span.len);
            if ((si.city == current_span.city) && si.order == (current_span.start + current_span.len + 1)) {
                current_span.len += 1;
            } else if ((si.city != current_span.city) || si.order != (current_span.start + current_span.len + 1)) {
                //                   console.log("different city or same city but not neighbours")
                let token = this.emitFullToken(current_span, previous_full_city != current_span.city, use_invader_numbers);
                encoded.push(token);
                previous_full_city = current_span.city;
                current_span.city = si.city;
                current_span.start = si.order;
                current_span.len = 0;
            }
        }
        //      console.log("flush");
        encoded.push(this.emitFullToken(current_span, previous_full_city != current_span.city, use_invader_numbers));
        //      console.log(encoded);
        return encoded;
    }

    // use_invader_numbers allows to squeeze one char for orders < 10
    printInvaderNumber(num, use_invader_numbers = true) {
        if (num < 10 && use_invader_numbers == true)
            return "0" + num;
        else
            return num;
    }

    handleOrderToken(order, current_list) {
        if (order.length == 0) return;
        let start, end;
        if (order.indexOf(",") != -1) { // we have an absolut range
            let bounds = order.split(",");
            start = Number(bounds[0]);
            end = Number(bounds[1]);
            if (end >= start)
                this.handleRelativeOrderRange(start, end - start + 1, current_list);
        } else if (order.indexOf("+") != -1) {
            let bounds = order.split("+");
            start = Number(bounds[0]);
            let len = bounds[1].length == 0 ? 1 : Number(bounds[1]);
            this.handleRelativeOrderRange(start, len + 1, current_list)
        } else { /// single number
            let num = Number(order)
            this.handleRelativeOrderRange(num, 1, current_list);
        }
    }
    handleRelativeOrderRange(r1, len, current_list) {
        for (let l = 0; l < len; ++l) {
            let full_code = this.current_city_code + "_" + this.printInvaderNumber(r1 + l);
            if (!current_list.includes(full_code)) current_list.push(full_code);
        }
    }
}

export { FlashFileParser  };