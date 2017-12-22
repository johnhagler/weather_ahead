var LocationUtil = {};
LocationUtil.getLocation = function(addressResults) {
    var result = LocationUtil.getCity(addressResults);

    if (!result) {
        result = LocationUtil.getCounty(addressResults);
        if (!result) {
            result = Ap.location.getState(addressResults);
        }

    }

    return result;
}

LocationUtil.getCity = function (addressResults) {
    for (var i = 0; i < addressResults.length; i++) {
        if (addressResults[i].types[0] == 'locality') {
            return addressResults[i].formatted_address;
        }
    }
}

LocationUtil.getCounty = function (addressResults) {
    for (var i = 0; i < addressResults.length; i++) {
        if (addressResults[i].types[0] == 'administrative_area_level_2') {
            return addressResults[i].formatted_address;
        }
    }
}

LocationUtil.getState = function (addressResults) {
    for (var i = 0; i < addressResults.length; i++) {
        if (addressResults[i].types[0] == 'administrative_area_level_1') {
            return addressResults[i].formatted_address;
        }
    }
}

LocationUtil.getCountry = function (addressResults) {
    for (var i = 0; i < addressResults.length; i++) {
        if (addressResults[i].types[0] == 'country') {
            return addressResults[i].formatted_address;
        }
    }
}