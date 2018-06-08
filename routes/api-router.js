'use strict';
const express = require('express');
const apiRouter = express.Router();
const yelp = require('yelp-fusion');
const yelpApi = require('../externalApis/yelpapi.js');
const meetupApi = require('../externalApis/meetupapi.js');
const seatgeekApi = require('../externalApis/seatgeekapi.js');
const eventbriteApi = require('../externalApis/eventbriteapi.js');
const yelpEventApi = require('../externalApis/yelpeventsapi.js');
const googlePlacesApi = require('../externalApis/googleplacesapi.js');
const misc = require('../miscfuncs/misc.js');

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
let client = yelp.client(process.env.API_KEY);



//Search for business
apiRouter.post('/', (req, res, next) => {

    // API calls toggles (if true, do the API call)
    var doYelpLunchCalls = true;
    var doYelpDinnerCalls = true;
    var doYelpEventCalls = false;
    var doMeetupCalls = true;
    var doEventbriteCalls = true;
    var doSeatgeekCalls = true;
    var doGooglePlacesCalls = true;

    // Variables for returned data
    var yelpBreakfastItemsGlobal;
    var yelpLunchItemsGlobal;
    var yelpDinnerItemsGlobal;
    var meetupItemsGlobal;
    var seatgeekItemsGlobal;
    var yelpEventsGlobal;
    var eventbriteGlobal
    var googlePlacesGlobal;
    var date = new Date(req.body.date);
    var string_date = req.body.string_date

    // Yelp API Inputs
    const BREAKFAST_HOUR = 9; // hours from 12:00am
    const LUNCH_HOUR = 13;  // 1 pm
    const DINNER_HOUR = 18; // 6 pm
    const BREAKFAST = "Breakfast";
    const LUNCH = "Lunch";
    const DINNER = "Dinner";

    // Empty arrays in case some error occurred during api call
    const EMPTY_EVENT_ARRAY ={
        Event1: [],
        Event2: [],
        Event3: [],
        Event4: []
    }; 

    const NONE_ITEM = {
        name: "None/Free Itinerary Slot",
        cost: 0,
        rating: 4.4,
        time: "9999",
        location: {},
      }

    // Promise Chain of API calls

    // Start with breakfast restaurants
    yelpApi.getYelpData(BREAKFAST, req.body.latlon, client, date, string_date, BREAKFAST_HOUR).then(
        function (yelpBreakfastItems) {
            if (yelpBreakfastItems===false) { // some error occured during api call
                yelpBreakfastItemsGlobal = NONE_ITEM;
            }
            else {
                yelpBreakfastItemsGlobal = yelpBreakfastItems;
            }

            // Find yelp businesses with 'lunch' term
            if (doYelpLunchCalls) {
                return yelpApi.getYelpData(LUNCH, req.body.latlon, client, date, string_date, LUNCH_HOUR);
            }
            else {
                return NONE_ITEM;
            }

        }, function (err) {
            return err;
        })
        .catch(function (e) {
            console.log(e)
        }) // -------------------------- End yelp lunch restaurants search
        .then(function (yelpLunchItems) {
            if (yelpLunchItems===false) { // some error occured during api call
                yelpLunchItemsGlobal = NONE_ITEM;
            }
            else {
                yelpLunchItemsGlobal = yelpLunchItems;
            }

            if (doYelpDinnerCalls) {
                return yelpApi.getYelpData(DINNER, req.body.latlon, client, date, string_date, DINNER_HOUR);
            }
            else {
                return NONE_ITEM;
            }

        }, function (err) {
            return err;
        }).catch(function (e) {
            console.log(e)
        }) // -------------------------- End yelp dinner restaurants search
        .then(function (yelpDinnerItems) {
            if (yelpDinnerItems===false) { // some error occured during api call
                yelpDinnerItemsGlobal = NONE_ITEM;
            }
            else {
                yelpDinnerItemsGlobal = yelpDinnerItems;
            }

            if (doMeetupCalls) {
                // Fulfilled promise returned from getMeetupData is an array of object arrays
                return meetupApi.getMeetupData(req.body.latlon, date);
            }
            else {
                var meetupEvents = EMPTY_EVENT_ARRAY;
                meetupEvents.Event1.push({})
                meetupEvents.Event2.push({})
                meetupEvents.Event3.push({})
                meetupEvents.Event4.push({})
                return meetupEvents;
            }

        }, function (err) {
            return err;
        }).catch(function (e) {
            console.log(e)
        }) // -------------------------- End meetup event search
        .then(function (meetupEvents) {
            if (meetupEvents===false) { // some error occured during api call
                meetupItemsGlobal = EMPTY_EVENT_ARRAY;
            }
            else {
                meetupItemsGlobal = meetupEvents;
            }

            if (doSeatgeekCalls) {
                // Fulfilled promise returned from getSeatGeekData is an array of object arrays
                return seatgeekApi.getSeatGeekData(req.body.city, date);
            }
            else {
                var seatgeekEvents = EMPTY_EVENT_ARRAY;
                seatgeekEvents.Event1.push({})
                seatgeekEvents.Event2.push({})
                seatgeekEvents.Event3.push({})
                seatgeekEvents.Event4.push({})
                return seatgeekEvents;
            }

        }, function (err) {
            return err;
        }).catch(function (e) {
            console.log(e)
        })  // -------------------------- End seatgeek event search
        .then(function (seatgeekEvents) {
            if (seatgeekEvents===false) { // some error occured during api call
                seatgeekItemsGlobal = EMPTY_EVENT_ARRAY;
            }
            else {
                seatgeekItemsGlobal = seatgeekEvents;
            }

            if (doYelpEventCalls) {
                return yelpEventApi.getYelpEventData(date, req.body.latlon, client);
            }
            else {
                var yelpEvents = EMPTY_EVENT_ARRAY;
                yelpEvents.Event1.push({})
                yelpEvents.Event2.push({})
                yelpEvents.Event3.push({})
                yelpEvents.Event4.push({})
                return yelpEvents;
            }

        }, function (err) {
            return err;
        }).catch(function (e) {
            console.log(e)
        })  // -------------------------- End yelp event search
        .then(function (yelpEvents) {
            if (yelpEvents===false) { // some error occured during api call
                yelpEventsGlobal = EMPTY_EVENT_ARRAY;
            }
            else {
                yelpEventsGlobal = yelpEvents;
            }

            if (doEventbriteCalls) {          
                return eventbriteApi.getEventbriteData(req.body.term, req.body.latlon, req.body.city, date);              
            }
            else {
                var eventbriteEvents = EMPTY_EVENT_ARRAY;
                eventbriteEvents.Event1.push({})
                eventbriteEvents.Event2.push({})
                eventbriteEvents.Event3.push({})
                eventbriteEvents.Event4.push({})
                return eventbriteEvents;
            }

        }, function (err) {
            return err;
        }).catch(function (e) {
            console.log(e)
        })  // -------------------------- End eventbrite event search
        .then(function (eventbriteEvents) {
            if (eventbriteEvents===false) { // some error occured during api call
                evenbriteGlobal = EMPTY_EVENT_ARRAY; 
            }
            else { // api call was fine
                eventbriteGlobal = eventbriteEvents;            
            }
            if (doGooglePlacesCalls) {
                return googlePlacesApi.getGooglePlacesData(req.body.latlon);
            }
            else {
                var googlePlacesEvents = EMPTY_EVENT_ARRAY;
                googlePlacesEvents.Event1.push({})
                googlePlacesEvents.Event2.push({})
                googlePlacesEvents.Event3.push({})
                googlePlacesEvents.Event4.push({})
                return googlePlacesEvents;
            }

        }, function (err) {
            return err;
        }).catch(function (e) {
            console.log(e)
        })  // -------------------------- End eventbrite event search
        .then(function (googlePlaces) {
            if (googlePlaces === false) { // some error occured during api call
                googlePlacesGlobal = EMPTY_EVENT_ARRAY;
            }
            else {
                googlePlacesGlobal = googlePlaces;
            }

            // Consolidate all events and yelp restaurants/businesses
            var events = {
                meetupItemsGlobal,
                yelpEventsGlobal,
                eventbriteGlobal,
                seatgeekItemsGlobal,
                googlePlacesGlobal,
                yelpBreakfastItemsGlobal,
                yelpLunchItemsGlobal,
                yelpDinnerItemsGlobal,
            };

            if (!misc.isEmpty(events)) {
                console.log("finished all api calls.")
                res.send(events);
            }
            else {
                res.send([])
            }

        }, function (err) {
            return err;
        }).catch(function (e) {
            console.log(e)
        });
});


// ------------- Yelp API Stuff

// Get initial data length from Yelp
function getYelpDataLength(term_in, latlon_in) {
    return new Promise(function (resolve, reject) {
        client.search({
            term: term_in,
            location: latlon_in,
            limit: 50,
        }).then(response => {
            var total = response.jsonBody.total;
            console.log("yelp total: " + total)
            resolve(total);
        }).catch(e => {
            console.log(e);
            reject(-1);
        });
    });
}

module.exports = apiRouter;
