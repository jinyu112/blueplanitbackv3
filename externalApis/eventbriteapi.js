const token = process.env.EVENTBRITE_TOKEN;
const misc = require('../miscfuncs/misc.js');
const request = require('request');
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
module.exports = {
    getEventbriteData: function (term_query, latlon, city, date_in) {
        return new Promise(function (resolve, reject) {
            // ACCESS EVENTBRITE API

            var base_url = 'https://www.eventbriteapi.com/v3/'

            var latlongarray = misc.processLocationString(latlon);

            var latitude = latlongarray[0];
            var longitude = latlongarray[1];

            var today = misc.getDate(date_in, -1);
            var dateEnd = misc.getDate(date_in, 0);

            var options = {
                url: base_url + 'events/search',
                headers: {
                    'Authorization': 'Bearer ' + token
                },
                qs: {
                    // 'q': term_query,
                    'location.latitude': latitude,
                    'location.longitude': longitude,
                    'start_date.range_start': today,
                    'start_date.range_end': dateEnd,
                    'price': 'free',
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
                            var approximateFee = true; // always true because eventbrite search currently ONLY returns free events
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
                                cost = 10;
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
                                        if (event.description.text.length>MAX_DESCRIPTION_LENGTH) {
                                            description = event.description.text.substring(0,MAX_DESCRIPTION_LENGTH-1);
                                            description += "...";
                                        }
                                        else {
                                            description = event.description.text;
                                        }
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
                                origin: 'eventbrite'
                            };

                            if (event.start) {
                                if (event.start.local) {
                                    // Categorize the events by time and push to seatgeekEvents
                                    if (timeFloat <= EVENT1_TIME) {
                                        eventbriteEvents.Event1.push(item);
                                        eventCnt++;
                                    }
                                    else if (timeFloat <= EVENT2_TIME) {
                                        eventbriteEvents.Event2.push(item);
                                        eventCnt++;
                                    }
                                    else if (timeFloat <= EVENT3_TIME) {
                                        eventbriteEvents.Event3.push(item);
                                        eventCnt++;
                                    }
                                    else if (timeFloat < EVENT4_TIME) {
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
