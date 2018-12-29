const token = process.env.EVENTBRITE_TOKEN;
const misc = require('../miscfuncs/misc.js');
const request = require('request');
const CONSTANTS = require('../constants_back.js');
const EBRATING_BASE = 10.5; // Base rating for a meetup event
const RATING_INCR = 0.0;
const EVENT1_TIME = 900;
const EVENT2_TIME = 1200;
const EVENT3_TIME = 1800;
const EVENT4_TIME = 2400;
const MAX_DESCRIPTION_LENGTH = 1000;
const MAX_DEFAULT_EVENT_DURATION = 3.0; //hours
const SEC_TO_HOURS = 1 / 60 / 60;
const DURATION_BIAS = 0.0;

// current api rate limit: 2000 calls/hr and 48000 calls/day
// https://www.eventbrite.com/developer/v3/endpoints/events/
// https://www.eventbrite.com/developer/v3/api_overview/errors/
// eventbrite api does not provide lat long info for the event unless the event venue is queried separately
// category ids:
// 113 - Interest Groups
// 101 - Business / Seminar
// 103 - Party 
// 104 - Networking / Premier
// 105 - Talks / Poetry?
// 106 - Fashion Show 
// 107 - Workshops
// 108 - Sport 
// 109 - Tour 
// 110 - Dance
// 111 - Charity
// 112 - Politics
// 114 - Tours? 
// 199 - Training
module.exports = {
    getEventbriteData: function (term_query, latlon, city, date_in, search_radius_miles, eventType_in) {
        return new Promise(function (resolve, reject) {
            // ACCESS EVENTBRITE API

            var base_url = 'https://www.eventbriteapi.com/v3/'

            var latlongarray = misc.processLocationString(latlon);

            var latitude = latlongarray[0];
            var longitude = latlongarray[1];

            var today = misc.getDate(date_in, -1);
            var dateEnd = misc.getDate(date_in, 0);

            if (search_radius_miles<1) {
                search_radius_miles = 1;
            }
            var search_radius = search_radius_miles + 'mi'; //needs to be astring
            var eventType = parseInt(eventType_in);

            var options = {
                url: base_url + 'events/search',
                headers: {
                    'Authorization': 'Bearer ' + token
                },
                qs: {
                    // 'q': term_query,
                    'categories': CONSTANTS.EB_EVENTTYPE_SEARCHKEYS[eventType], //comma delimited string of category IDs
                    'location.latitude': latitude,
                    'location.longitude': longitude,
                    'start_date.range_start': today,
                    'start_date.range_end': dateEnd,
                    //'price': 'free', // only return free events because non free events don't return a cost
                    'location.within': search_radius,
                }
                // qs: {'q': term_query, 'location.city': city }
            };

            var eventbriteEvents = {
                Event1: [],
                Event2: [],
                Event3: [],
                Event4: []
            };

            var eventCnt = 0;

            function callback(error, response, body) {
                if (!error && response.statusCode == 200) {

                    var events = JSON.parse(response.body);
                    var cnt = 1;
                    //console.log(events)
                    if (events.events.length > 0) {
                        events.events.forEach(function (event, index, array) {

                            var cost = 0;
                            var rating = 0;
                            var url = '';
                            var logoUrl = '';                        
                            var name = '';
                            var date = '';
                            var eventLocation = '';
                            var duration=MAX_DEFAULT_EVENT_DURATION;
                            var defaultDuration; // the default event duration is returned (ie api call didn't provide event duration data)
                            var approximateFee = false; // always true because eventbrite search currently ONLY returns free events
                            var phone='';
                            var address='';
                            var description = '';
                            var time = event.start.local;
                            if (time) {
                                time = misc.processTimeSG(time);
                            } else {
                                time = '9999';
                            }

                            var timeFloat = parseFloat(time);
                            if (event.is_free == false) {
                                cost = CONSTANTS.NOCOST_EVENT_COST;
                                approximateFee = true;
                            } else {
                                cost = 0;
                            }

                            // Give the event a rating
                            rating = EBRATING_BASE; // base rating for a eventbrite event
                            if (event.url && event.url !== '') {
                                rating = rating + RATING_INCR;
                                url = event.url;
                            }

                            if (event.logo) {
                                if (event.logo.url && event.logo.url !== '') {
                                    logoUrl = event.logo.url;
                                }
                            }

                            if (event.description) {
                                if (event.description.text && event.description.text !== '') {
                                    if (event.description.text.length > 0) {
                                        // if (event.description.text.length>MAX_DESCRIPTION_LENGTH) {
                                        //     description = event.description.text.substring(0,MAX_DESCRIPTION_LENGTH-1);
                                        //     description += "...";
                                        // }
                                        // else {
                                            description = event.description.text;
                                        // }
                                    }
                                }
                            }

                            // Collect the name of the event
                            if (event.name) {
                                if (event.name.text) {
                                    name = event.name.text;
                                }
                            }

                            // Collect the date
                            duration = MAX_DEFAULT_EVENT_DURATION;
                            defaultDuration=true;
                            if (event.start) {
                                if (event.start.local) {
                                    date = date_in;
                                }

                                // Calculate duration of event
                                var dateEnd;
                                if (event.end) {
                                    if (event.end.local) {
                                        var startDateObj = new Date(event.start.local);
                                        var endDateObj = new Date(event.end.local);
                                        duration = (endDateObj.getTime() - startDateObj.getTime()) / 1000; //seconds
                                        duration = misc.round2NearestTenth(duration * SEC_TO_HOURS) + DURATION_BIAS;
                                        defaultDuration = false;
                                    }
                                }
                            }


                            // Collect location information
                            if (event.venue_id) {
                                // eventLocation = event.venue_id;
                                eventLocation = {
                                    lat: latitude,
                                    lng: longitude
                                };
                                // distance = getDistanceFromLatLonInMi(latitude,longitude,)
                                rating = rating + RATING_INCR;
                            }


                            rating = misc.round2NearestHundredth(rating);
                            var item = {
                                name: name,
                                cost: cost,
                                rating: rating,
                                url: url,
                                time: time,
                                date: date,
                                thumbnail: logoUrl,
                                description: description,
                                location: eventLocation,
                                duration: duration,
                                defaultDuration: defaultDuration,
                                approximateFee: approximateFee,
                                phone: phone,
                                address: address,
                                other: [],
                                origin: 'eventbrite',
                                dist_within: search_radius_miles, // integer
                                distance_from_input_location: 0,
                                original_itin_pos: 0,
                            };

                            if (event.start && parseFloat(time) >= 400 ) {
                                if (event.start.local) {
                                    // Categorize the events by time and push to seatgeekEvents
                                    if (timeFloat <= EVENT1_TIME) {
                                        item.original_itin_pos = 0;
                                        eventbriteEvents.Event1.push(item);
                                        eventCnt++;
                                    }
                                    else if (timeFloat <= EVENT2_TIME) {
                                        item.original_itin_pos = 2;
                                        eventbriteEvents.Event2.push(item);
                                        eventCnt++;
                                    }
                                    else if (timeFloat <= EVENT3_TIME) {
                                        item.original_itin_pos = 4;
                                        eventbriteEvents.Event3.push(item);
                                        eventCnt++;
                                    }
                                    else if (timeFloat < EVENT4_TIME) {
                                        item.original_itin_pos = 6;
                                        eventbriteEvents.Event4.push(item);
                                        eventCnt++;
                                    }
                                }
                            }

                            if (events.events.length == index + 1) {
                                console.log("number of eventbrite events: " + eventCnt)
                                resolve(eventbriteEvents);
                            }
                        });

                    }
                    else {
                        resolve(eventbriteEvents);
                    }
                } else {
                    console.log(error);
                    reject(false); // possibly rate limited
                }
            }

            request(options, callback);
        });
    },
}
