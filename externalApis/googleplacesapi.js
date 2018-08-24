// Currently only returns 20 results max, and only searches for parks within a x mile radius
// Only searching parks because it is difficult to price the other returned places because there
// is no pricing data


const misc = require('../miscfuncs/misc.js');
const CONSTANTS = require('../constants_back.js');
var GooglePlaces = require('googleplaces');
const GOOGLE_PLACES_OUTPUT_FORMAT = "json"
var googlePlaces = new GooglePlaces(process.env.GOOGLE_API_KEY, GOOGLE_PLACES_OUTPUT_FORMAT);
const RADIUS = 80467.2; //meters (50 miles)
const GPRATING_BASE = 10.5; // Base rating for a google place event
const RATING_INCR = 0.0;
const MAX_DEFAULT_EVENT_DURATION = 3; //hours
const EVENT1_TIME = 900;
const EVENT2_TIME = 1200;
const EVENT3_TIME = 1800;
const EVENT4_TIME = 2400;

module.exports = {
    getGooglePlacesData: function (location_in, search_radius_miles) {
        return new Promise(function (resolve, reject) {
            try {
                //console.log(location_in)
                var googlePlacesEvent = {
                    Event1: [],
                    Event2: [],
                    Event3: [],
                    Event4: []
                };

                var search_radius = search_radius_miles; 

                var parameters = {
                    location: location_in,
                    type: "park",
                    radius: search_radius*CONSTANTS.MILES_TO_METERS,
                };
                googlePlaces.placeSearch(parameters, function (error, response) {
                    if (error) {
                        console.log(error);
                        reject(false);
                    } else {
                        var numOfPlaces = response.results.length;
                        var placeCnt = 0;
                        for (var i = 0; i < numOfPlaces; i++) {   
                            var cost = CONSTANTS.NOCOST_EVENT_COST;
                            var rating = 0;
                            var url = '';
                            var logoUrl = '';                        
                            var name = '';
                            var date = '';
                            var placeLocation = '';
                            var duration = MAX_DEFAULT_EVENT_DURATION;
                            var defaultDuration = true; // the default event duration is returned (ie api call didn't provide event duration data)
                            var vicinity =''; //google places returns an address or phrase
                            var approximateFee = true;
                            var phone='';
                            var address='';
                            var description = 'Park/Outdoors';

                            // Collect the name of the event
                            if (response.results[i].name) {
                                name = response.results[i].name;
                                
                                // Construct URL
                                var nameArrayForUrl = new Array();
                                nameArrayForUrl = name.split(" ");
                                url = 'https://www.google.com/search?q=';
                                for (var ii = 0; ii < nameArrayForUrl.length; ii++) {
                                    url = url + nameArrayForUrl[ii];
                                    if (ii !== nameArrayForUrl.length - 1) {
                                        url = url + "+";
                                    }
                                }
                            }
                            
                            // Collect location information
                            if (response.results[i].geometry) {
                                if (response.results[i].geometry.location) {
                                    placeLocation = {
                                        lat: response.results[i].geometry.location.lat,
                                        lng: response.results[i].geometry.location.lng
                                    }
                                }
                            }
                            if (response.results[i].vicinity) {
                                vicinity=response.results[i].vicinity;
                            }

                            // Description
                            if (response.results[i].opening_hours) {
                                if (response.results[i].opening_hours.open_now) {
                                    description += ", Open Now";
                                }
                                else {
                                    description += ", Closed Now";
                                }
                            }

                            // google rating
                            if (response.results[i].rating) {
                                rating = response.results[i].rating;
                            }
                            rating = misc.round2NearestHundredth(rating);


                            // Randomize time 
                            var timernd = Math.floor(Math.random() * 2); //random number: 0 or 1

                            if (timernd == 1) {
                                time = '0800';
                            }
                            else {
                                time = '1500';
                            }

                            var timeFloat = parseFloat(time);

                            var item = {
                                name: name,
                                cost: cost,
                                rating: GPRATING_BASE,
                                url: url,
                                time: time,
                                date: date,
                                thumbnail: logoUrl,
                                description: description,
                                location: placeLocation, // lat lon
                                duration: duration,
                                defaultDuration: defaultDuration,
                                vicinity: vicinity,
                                approximateFee: approximateFee,
                                phone: phone,
                                address: address,
                                other: rating,
                                origin: 'places',
                                dist_within: search_radius, // integer
                            }

                            if (time && rating > 4.0) {
                                // Categorize the events by time
                                if (timeFloat <= EVENT1_TIME) {
                                    googlePlacesEvent.Event1.push(item);
                                    placeCnt++;
                                }
                                else if (timeFloat <= EVENT2_TIME) {
                                    googlePlacesEvent.Event2.push(item);
                                    placeCnt++;
                                }
                                else if (timeFloat <= EVENT3_TIME) {
                                    googlePlacesEvent.Event3.push(item);
                                    placeCnt++;
                                }
                                else if (timeFloat < EVENT4_TIME) {
                                    googlePlacesEvent.Event4.push(item);
                                    placeCnt++;
                                }
                            }
                        }
                        console.log("number of google places: " + placeCnt)
                        resolve(googlePlacesEvent);
                    }
                });
            }
            catch (e) {
                console.log(e);
                console.log('error in getGooglePlacesData')
                reject(false);
            }
        });

    }
}
