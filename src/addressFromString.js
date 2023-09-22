const CA_STATES = 'ON|QC|NS|NB|MB|BC|PE|SK|AB|NL|NT|YT|NU|ON|QC|NS|NB|MB|BC|PE|SK|AB|NL|NT|YT|NU|Alberta|British Columbia|Manitoba|New Brunswick|Newfoundland and Labrador|Nova Scotia|Ontario|Prince Edward Island|Quebec|Québec|Saskatchewan|Northwest Territories|Nunavut|Yukon|l[’`\']Alberta|Colombie-Britannique|Manitoba|Nouveau-Brunswick|Terre-Neuve-et-Labrador|Territoires du Nord-Ouest|Nouvelle-Écosse|Nunavut|l[’`\']Ontario|l[’`\']île du Prince-Édouard|Québec|Saskatchewan|Yukon';


var postcodes = [
    { "country": "UK", "one_only": true, "zipcode_in_end": false,  "regex_string":'\\b([a-z]\\d[\\s-]*\\d[a-z][a-z]|[a-z]\\d[a-z][\\s-]*\\d[a-z][a-z]|[a-z]\\d\\d[\\s-]*\\d[a-z][a-z]|[a-z]\\d\\d[a-z][\\s-]*\\d[a-z][a-z]|[a-z][a-z]\\d[\\s-]*\\d[a-z][a-z]|[a-z][a-z]\\d[a-z][\\s-]*\\d[a-z][a-z]|[a-z][a-z]\\d\\d[\\s-]*\\d[a-z][a-z])\\b' },
    { "country": "US", "one_only": false, "zipcode_in_end": false, "regex_string":'\\b((Chicago,?|Houston,?|Philadelphia,?|Phoenix,?|Alabama,?|Alaska,?|Arizona,?|Arkansas,?|California,?|Colorado,?|Connecticut,?|Delaware,?|Florida,?|Georgia,?|Hawaii,?|Idaho,?|Illinois,?|Indiana,?|Iowa,?|Kansas,?|Kentucky,?|Louisiana,?|Maine,?|Maryland,?|Massachusetts,?|Michigan,?|Minnesota,?|Mississippi,?|Missouri,?|Montana,?|North Carolina,?|North Dakota,?|Nebraska,?|Nevada,?|New Hampshire,?|New Jersey,?|New Mexico,?|New York,?|Ohio,?|Oklahoma,?|Oregon,?|Pennsylvania,?|Rhode Island,?|South Carolina,?|South Dakota,?|Tennessee,?|Texas,?|Utah,?|Vermont,?|Virginia,?|Washington,?|West Virginia,?|Wisconsin,?|Wyoming,?|American Samoa,?|D\\.C\\.,?|Guam,?|Puerto Rico,?|AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NC|ND|NE|NV|NH|NJ|NM|NY|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|AS|DC|GU|MP|PR|VI)\\s+\\d{5}(-\\d{4})?)\\b' },
    {
        "country"          : "CA",
        "one_only"         : true,
        "zipcode_in_end"   : false,
        "regex_string"     : '\\b([A-Za-z]\\d[A-Za-z][ -]?\\d[A-Za-z]\\d)\\b',
        // additional search for addresses without zip
        /*"regex_string_ext" : [
            {
                'value' : '\\b('+CA_STATES+'+)\\b',
                'flags' : ''
            },
            {
                'value': '\\b(Alberta|British Columbia|Manitoba|New Brunswick|Newfoundland and Labrador|Nova Scotia|Ontario|Prince Edward Island|Quebec|Saskatchewan|Northwest Territories|Nunavut|Yukon|l[’`\']Alberta|la Colombie-Britannique|le Manitoba|le Nouveau-Brunswick|la Terre-Neuve-et-Labrador|les Territoires du Nord-Ouest|la Nouvelle-Écosse|le Nunavut|l[’`\']Ontario|l[’`\']île du Prince-Édouard|le Québec|la Saskatchewan|le Yukon|le territoire du Yukon)\\b',
                'flags': 'i'
            }
        ]*/
    },
    { "country": "AU", "one_only": true, "zipcode_in_end": true,  "regex_string":'\\b(NSW|ACT|VIC|QLD|SA|WA|TAS|NT|N.S.W.|A.C.T.|V.I.C.|Q.L.D.|S.A.|W.A.|T.A.S.|N.T.)\\s+(\\d{4})\\b' }
];


// Add the block RE to each postcode block, and make real RegExps
for (var i = 0; i < postcodes.length; i++) {
    postcodes[i]['regex'] = new RegExp( postcodes[i]['regex_string'], 'i' );

    // Multi-line capture before hand
    if (postcodes[i]['zipcode_in_end'] == false){
        postcodes[i]['regex_block'] = new RegExp( '([\\s\\S]+)(' + postcodes[i]['regex_string'] + ')', 'i' );
    } else {
        postcodes[i]['regex_block'] = new RegExp( '([\\s\\S]+)[ ,]*(' + postcodes[i]['regex_string'] + ')', 'i' );
    }

    if( postcodes[i]['regex_string_ext'] ) {
        postcodes[i]['regex_block_ext'] = new Array();
        for (let j = 0; j < postcodes[i]['regex_string_ext'].length; j++) {
            let elem = postcodes[i]['regex_string_ext'][j];
            let regex = new RegExp( '([\\s\\S]+)(' + elem['value'] + ')', elem['flags'] );
            postcodes[i]['regex_block_ext'].push(regex);
        }
    }
}



exports.addressFromString = function ( toolkit, text ) {
    //console.log(text);
    //console.log('444');

    // Build up addresses here
    var addresses  = [];

    // Postcodes we've already seen
    var codes_seen = {};


    // Attempt to split incoming text in to paragraphs
    var blocks = text.split(/\n\s*\n/);


    /*let blocksDoubled = [];
    for ( let i = 0; i < blocks.length - 1; i++ ){
        let line = blocks[i] + blocks[i+1];
        blocksDoubled.push(line);
    }

    Array.prototype.push.apply(blocks, blocksDoubled);*/



    // In our first attempt, we pull out strings that end with postcodes, and
    // all that came before it in the block. So start with the Cartesian Product
    // of blocks and postcode types...
    for (var i = 0; i < blocks.length; i++) {
        var block = blocks[i];
        var address = [];
        //console.log(block);

        /*if (block.match(/<iframe(.+)frame>/g)){
            let mapCode = block.match(/<iframe(.+)frame>/g)
            console.log(mapCode);
        }*/
        for (var ii = 0; ii < postcodes.length; ii++) {
            var country = postcodes[ii];

            /*if ( country['one_only'] && i > blocksDoubled.length) {
                break;
            }*/
            // Do we match some stuff and then a postcode? Add some padding to
            // our block so we'll always have a leading block if we wanted one
            var padded = '  ' + block;
            //console.log(country);
            var match = padded.match( country['regex_block'] );
            //console.log( country );
            //console.log( match );
            if ( !match && country['regex_block_ext'] ){
                for (let j = 0; j < country['regex_string_ext'].length; j++) {
                    let match_part = padded.match(country['regex_block_ext'][j]);
                    if (match_part) {
                        match = match ? match.concat(match_part) : match_part;
                    }
                }
            }
            //console.log( match );
            if ( match ) {

                //console.log(match);

                if (match[1].match(/alt=["”']|src=["”']|["”']alt["”']|["”']title["”']|<style/)){
                    break;
                }

                if ( country['country'] == 'CA' && match[1][match[1].length-1] == '#' ){
                    break;
                }

                var prefix   = match[1];
                var postcode = match[2];

                if (country['zipcode_in_end'] == false){
                    var prefix   = match[1];
                    var postcode = match[3];
                }

/*
                                console.log('---');
                                                console.log(prefix);
                                                console.log(postcode);
                                console.log('---');
*/

                if ( prefix == postcode ){
                    break;
                }

                // For some countries, postcodes are specific enough that we
                // don't want to match twice
                if ( country['one_only'] ) {

                    if ( codes_seen[postcode] ) {
                        break;
                    } else {
                        codes_seen[postcode] = 1;
                    }
                }

                //add previous html block, until address prefix is 3 words at least
                //// do it max 4 times
                //console.log(prefix);
                for ( let step = 1; step < 5; step++ ) {
                    let wordNum = prefix.match(/([a-zàâçéèêëîïôûùüÿñæœ]+)/gi);
                    if ( blocks[i - step] && (!wordNum || wordNum.length < 3) ) {
                        prefix = blocks[i - step] + ' ' + prefix;
                    }
                }
                //console.log(prefix);

                // It had something before the postcode
                if ( prefix.match(/\w/) ) {
                    address = [ prefix, postcode, country['country'] ];
                    // Just the postcode (and maybe some space)
                } else {
                    break;
                    if (country['one_only']) {
                        break;
                    } else {
                        address = [postcode, country['country']];
                    }
                }
                break;
            }
            //console.log(address);

            // Stop checking if we found an address
            if ( address.length > 0 ) { break; }
        }

        // Did we find something?
        if ( address.length > 0 ) {
            addresses.push( address );
        }
    }

    // Partial addresses with just a postcode, try a little harder to find an
    // address for it...
    //console.log(addresses);
    var deletedOnTheFly = false;

    for (var i = 0; i < addresses.length; i++) {
        var address = addresses[i];

        // Check it's a postcode-only address
        if ( address.length != 2 ) continue;

        //console.log(address);
        var postcode = address[0];

        // Traverse through the blocks again, this time paying close attention
        // to our index
        var foundAtoms = [];

        for ( var it = 0; it < blocks.length; it++ ) {
            // If a line has our postcode on it (and if we got here (no chaff)
            // then it'll be the only thing on the line, then we trace backward
            if ( blocks[it].match( postcode ) ) {
                var cursor = 0;
                for ( cursor = (it - 1); cursor >= 0; cursor-- ) {
                    var block = blocks[cursor];
                    if ( block.length > 150 ) { break }
                    if ( block.match(/\n/) ) { break }
                    if ( block.match(/http:/) ) { break }
                    if ( block.match(/\baddress/i) ) { break }
                    foundAtoms.unshift( block );
                }
                break;
            }
        }

        if ( foundAtoms.length ) {
            addresses[i] = [ foundAtoms.join(', '), address[0], address[1] ];
        } else {
            deletedOnTheFly = true;
            addresses[i] = undefined;
        }
    }

    // Remove any we set to undefined
    if ( deletedOnTheFly ) {
        var newAddresses = [];
        for (var i=0; i < addresses.length; i++) {
            if ( addresses[i] ) {
                newAddresses.push( addresses[i] );
            }
        }
        addresses = newAddresses;
    }
    // Now we have some rough-hewn addresses, attempt to clean out any extra
    // data we captured
    for (var i=0; i < addresses.length; i++) {

        var prefix   = addresses[i][0];
        var postcode = addresses[i][1];
        var country  = addresses[i][2];

        // General address prefixing stuff to remove
        prefix = prefix.replace(/^.*(Registered Offices?( is| are)?|Tel|Telephone|Website|Téléphone|Facebook-f|Facebook|Instagram|Fax|Fax|Call on|Call|Licence|Address)\s*[: ]*\s*/mi, '');

        // Characters used for splitting atoms -> ,s
        prefix = prefix.replace(/[\n|]/g, ',');
        prefix = prefix.replace(/\u2022/g, ',');
        prefix = prefix.replace(/%u2022/g, ',');
        prefix = prefix.replace(/":"/g, ',');
        prefix = prefix.replace(/[\w-\.]+@([\w-]+\.)+[\w-]{2,4}/g, '');

        // Split it up in to parts, either by comma...
        prefix = prefix.replace(/,+/g, ',');
        prefix = prefix.replace(/,\s*$/g, '');



        /*-------------------------*/

        //console.log(prefix+'* *'+postcode+'* *'+country);
        //console.log(prefix);
        //remove part before /, ,/ OR at least 2 tabs,, we asume that should be another html tag
        let htmlBlocks = prefix.split(/, ,|\t{2}| > |   +/).filter( item => item.match(/([a-zàâçéèêëîïôûùüÿñæœ\d]+)/gi));

        //console.log(htmlBlocks);
        if (htmlBlocks) {
            //console.log(htmlBlocks);
            let hbsLast = htmlBlocks.length - 1,
                wordNum = htmlBlocks[hbsLast].match(/([a-zàâçéèêëîïôûùüÿñæœ]+)/gi) ? htmlBlocks[hbsLast].match(/([a-zàâçéèêëîïôûùüÿñæœ]+)/gi).length : 0;
            //console.log(htmlBlocks[hbsLast].match(/([a-zàâçéèêëîïôûùüÿñæœ]+)/gi));
            //console.log(htmlBlocks[hbsLast - 2] );
            //if last part contains less than 3 parts we ADD penultimate html block
            if (
                ( wordNum && wordNum < 3 && htmlBlocks[hbsLast - 1] )
                ||
                ( htmlBlocks[hbsLast - 1] && htmlBlocks[hbsLast - 1].match(/Blvd|Street|rue | apt[., ]?|/i) )
            ){
                htmlBlocks[hbsLast] = htmlBlocks[hbsLast - 1] + ', ' + htmlBlocks[hbsLast];
            }
            if ( htmlBlocks[hbsLast - 2] && htmlBlocks[hbsLast - 2].match(/Blvd|Street|rue | apt[., ]?|/i) ) {
                htmlBlocks[hbsLast] = htmlBlocks[hbsLast - 2] + ', ' + htmlBlocks[hbsLast];
            }
            prefix = htmlBlocks[hbsLast];
        }
        //console.log(prefix+'* *'+postcode+'* *'+country);


        /*-------------------------*/




        var atoms = prefix.split(/,/);
        //console.log(atoms);

        // Or on double-spaces if that didn't work
        if ( atoms && atoms.length == 1 ) {
            if ( atoms[0].match(/\s\s/) ) {
                atoms = atoms[0].split(/\s\s/);
            }
        }
        //console.log(atoms);

        //console.log(prefix);
        // Clean and sort atoms, including trying to get street numbers on their
        // own line on to the right line...
        var postAtoms = [];     // Accumulate in to this
        var orphan_number = ''; // Orphan number
        for (var ii = 0; ii < atoms.length; ii++) {
            var atom = atoms[ii];
            atom = atom.replace(/^\s*registered offices?( is| are)?/, '');
            atom = atom.replace(/^\s*\*\s*/, '' );
            atom = atom.replace(/^\s+/, '' );
            atom = atom.replace(/\s+$/, '' );
            atom = atom.replace(/[()]/, '' );
            atom = atom.replace(/\s+/g, ' ');
            atom = atom.replace(/,$/, '' );


            // try to remove copyright
            if (  atoms.length - ii > 3 && atom.match(/ltd[ .]+|©/i)  ){
                continue;
            }
            //console.log(atom);

            let regIsState       = new RegExp(CA_STATES, 'gi');
            //console.log(atom.match(regIsState));
            if ( !atom.match(/[\da-z]/) && !( atom.match(regIsState) ) ) {
                continue;
            }

            // try to add some trevious part of address
            if ( atom.length && atom.length < 100  && atom.length > 37) {
                atom = atom.split(/[,-]/).pop();
            }
            var number_only = atom.match(/^\d[ \d\-ab]*$/i);


            //console.log(atom);
            if ( number_only ) {
                orphan_number = atom;
            } else if ( ( atom.length && atom.length < 38 ) || ( atom.match(/Blvd|Street| rue | apt[., ]?|/i)) ) {
                if ( orphan_number ) {
                    atom = orphan_number + ' ' + atom;
                    orphan_number = undefined;
                }
                //console.log(atom);
                postAtoms.push( atom )
            }
        }
        // console.log(atom.match(/(ON|QC|NS|NB|MB|BC|PE|SK|AB|NL|NT|YT|NU|ON|QC|NS|NB|MB|BC|PE|SK|AB|NL|NT|YT|NU)/gi));

        // Clean up postcodes with too many delimiting spaces
        postcode = postcode.replace(/\s+/g, ' ');
        //.log(prefix+'* *'+postcode+'* *'+country);
        //console.log(postAtoms);
        var title = postAtoms[0];
        //console.log(postAtoms);
        if ( postAtoms[1] && (country == 'AU' || (title.length < 17 && postAtoms[1].length < 37)) ) {
            title += ' ' + postAtoms[1];
        }
        if ( title == undefined || ! title.length ) {
            //continue;
            title = postcode;
        }

        addresses[i] = toolkit.addressFromFields({
            'atoms': postAtoms,
            'title': title,
            'country': country,
            'postcode': postcode
        });

        //console.log(addresses[i]);
    }

    addresses = addresses.filter( (item) => item['title'] != item['postcode'])
        .filter( (item) => item['title'].match(/[A-Za-z]{2}/) && item['title'].length < 100 );


    return addresses;
}
