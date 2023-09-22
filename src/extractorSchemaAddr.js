

exports.extractor = function ( dom, url, toolkit, stash ) {

    var addresses = [];
    var seen = {};
    var cardElements = toolkit.sz('*[itemprop="address"]');

    //console.log(cardElements);

    for (var i=0; i < cardElements.length; i++) {
        var card = cardElements[i];


        // Now string together other bits of the address
        var addr = '';

        var asText = '';

        var parts = [
            'streetAddress', 'addressLocality', 'addressRegion',
            'postalCode','addressCountry'
        ];

        for (var ii=0; ii < parts.length; ii++) {
            var part = parts[ii];
            var atom = toolkit.sz('*[itemprop~="' + part + '"]', addr)[0];

            if ( atom ) {
                var val = toolkit.nodeToText(atom);

                // Fix up postcodes if they're weird...
                if (part == 'postalCode') {
                    val = val.replace(/^\s*(\d\d\d\d\d)(\d\d\d\d)\s*$/, "$1-$2")
                }

                // Append these parts. We append with a newline, except for
                // region, as we don't want to split that from a postcode
                if (part == 'addressRegion') {
                    asText += val + ' ';
                } else {
                    asText += val + "\n";
                }
            }
        }

        if (! seen[asText]) {
            seen[asText] = 1;
            var parsedAddress = toolkit.addressFromString( toolkit, asText )[0];

            if ( parsedAddress ) {
                parsedAddress['atoms'] = toolkit.cleanAddress( parsedAddress['atoms'] );
                parsedAddress['via'] = 'SchemaAddr';
                addresses.push( parsedAddress );
            }
        }
    }
    //console.log(addresses);
    return addresses;
}
