const misc = require('../miscfuncs/misc.js');
const CONSTANTS = require('../constants_back.js');
const MAX_DEFAULT_EVENT_DURATION = 1.5; //hours
// https://www.yelp.com/developers/documentation/v3/business_search
//  current rate limit is 25000 per day

//  can use categories endpoint to help with "personalizing" search results
// https://www.yelp.com/developers/documentation/v3/all_category_list
// OR use the term endpoint but not both because it will severely limit the results
module.exports = {

    // Get data from Yelp and format it
    getYelpData: function (term_in, location_in, client, date, string_date, hours_offset, search_radius_miles) {
        return new Promise(function (resolve, reject) {
            const HOURS_TO_SECONDS = 3600;

            var date_substring = string_date.substring(4,16);
            var unix_time = new Date(date_substring).getTime()/1000 + hours_offset*HOURS_TO_SECONDS;
            unix_time = parseInt(unix_time);
            // console.log("term_in: " + term_in)
            // console.log("location_in: " + location_in)
            // console.log("date_substring: " + date_substring)
            
            var businesses = [];

            // search radius in miles
            var search_radius = Math.round(search_radius_miles*CONSTANTS.MILES_TO_METERS); // max is 40000 m (about 25 miles per yelp api doc) 

            if (search_radius > CONSTANTS.MAX_YELP_SEARCH_RADIUS) {
                search_radius = CONSTANTS.MAX_YELP_SEARCH_RADIUS; //currently about 25 mi
            }
            if (search_radius < 2*CONSTANTS.MILES_TO_METERS) {
                search_radius = 2*CONSTANTS.MILES_TO_METERS; 
            }

                client.search({
                    term: term_in,
                    //categories:'desserts',
                    //open_at: unix_time,
                    location: location_in,
                    limit: 50,
                    offset: 0,
                    radius: search_radius, // integer
                }).then(response => {

                    if (response.error) {
                        console.log(response.error);
                        reject(false);
                    }
                    else {
                    response.jsonBody.businesses.forEach(business => {
                        var url = '';
                        var logoUrl = '';                    
                        var name = '';
                        var time = 'Food'; //hi jacking the time field to display "Food" in the results
                        var date = '';
                        var businessLocation ='';
                        var duration = MAX_DEFAULT_EVENT_DURATION;
                        var defaultDuration = true;
                        var approximateFee =true;
                        var phone ='';
                        var address= '';
                        var yelpRating = 4.0;
                        var description = '';
                        var numDollarSigns = 1;

                        switch (business.price) {
                            case '$':
                                business.price = 10;
                                numDollarSigns = 1;
                                break;
                            case '$$':
                                business.price = 30; //20 before
                                numDollarSigns = 2;
                                break;
                            case '$$$':
                                business.price = 60; //46 before
                                numDollarSigns = 3;
                                break;
                            case '$$$$':
                                business.price = 100; //65 before
                                numDollarSigns = 4;
                                break;
                            default:
                                business.price = 30;
                                numDollarSigns = 2;
                        }

                        // Collect url
                        if (business.url) {
                            url = business.url;
                        }

                        // Collect image
                        if (business.image_url) {
                            logoUrl = business.image_url;
                        }

                        // Collect description
                        if (business.phone) {
                            phone = business.phone;
                        }

                        //untampered yelp rating
                        if (business.rating) {
                            yelpRating = business.rating;
                        }

                        // Create description field
                        if (business.categories) {
                            for (var i = 0; i < business.categories.length; i++) {
                                if (business.categories[i].title != undefined &&
                                business.categories[i].title != null) {
                                    description += business.categories[i].title;
                                    if (i!=business.categories.length-1) {
                                        description += ", ";
                                    }
                                }
                            }
                        }

                        // Create address field
                        if (business.location.display_address) {
                            for (var i = 0; i < business.location.display_address.length; i++) {
                                address += business.location.display_address[i];
                                if (i!=business.location.display_address.length-1) {
                                    address += ", ";
                                }
                            }
                        }

                        // Collect location information
                        businessLocation = location_in;

                        if (business.location) {
                            if (business.coordinates) {
                                // businessLocation = business.coordinates.latitude + "," + business.coordinates.longitude;
                                businessLocation = {
                                    lat: business.coordinates.latitude,
                                    lng: business.coordinates.longitude
                                }

                                var latLongArray = misc.processLocationString(location_in);
                                var lat_input = parseFloat(latLongArray[0]);
                                var long_input = parseFloat(latLongArray[1]);
                                distance_from_input_location = misc.getDistanceFromLatLonInMi(lat_input, long_input,
                                    businessLocation.lat, businessLocation.lng); //output is in mi
                                // do some limit checks
                                if (distance_from_input_location >= parseFloat(search_radius)) {
                                    distance_from_input_location = parseFloat(search_radius);
                                }
                                else if (distance_from_input_location < 0) {
                                    distance_from_input_location = 0;
                                } 
                            } else if (business.location.address1 &&
                                business.location.city &&
                                business.location.state &&
                                business.location.zip_code) {
                                businessLocation = business.location.address1 + "," +
                                    business.location.city + "," +
                                    business.location.state + "," +
                                    business.location.zip_code;
                                    distance_from_input_location = 0;
                            } else {
                                businessLocation = location_in;
                                distance_from_input_location = 0;
                            }

                        }

                        var iOriginalPos = 0;
                        if (term_in === CONSTANTS.BREAKFAST) {
                            iOriginalPos = 1;
                        }
                        else if (term_in === CONSTANTS.LUNCH) {
                            iOriginalPos = 3;
                        }
                        else {
                            iOriginalPos = 5;
                        }

                        var item = {
                            name: business.name,
                            cost: business.price,
                            rating: business.rating,
                            url: url,
                            time: time, // value is "Food"
                            date: date,
                            thumbnail: logoUrl,
                            description: description,
                            phone: phone,
                            address: address,
                            other: yelpRating,                            
                            location: businessLocation,
                            duration: duration,
                            defaultDuration: defaultDuration,
                            approximateFee: approximateFee,
                            origin: 'yelp',
                            dist_within: search_radius_miles, // integer in miles
                            distance_from_input_location: distance_from_input_location,
                            numDollarSigns: numDollarSigns,
                            original_itin_pos: iOriginalPos,
                        }
                        businesses.push(item);
                    });

                    resolve(businesses);
                }
                }).catch(e => {
                    console.log(e);
                    reject(false);
                });
        });
    }
}
