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
const CONSTANTS = require('../constants_back.js');

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
    var yelpBreakfastItemsGlobal = [CONSTANTS.NONE_ITEM];
    var yelpLunchItemsGlobal = [CONSTANTS.NONE_ITEM];
    var yelpDinnerItemsGlobal = [CONSTANTS.NONE_ITEM];
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
        Event1: [{}],
        Event2: [{}],
        Event3: [{}],
        Event4: [{}]
    }; 

    // Promise Chain of API calls

    // Start with breakfast restaurants
    yelpApi.getYelpData(BREAKFAST, req.body.latlon, client, date, string_date, BREAKFAST_HOUR, req.body.search_radius_miles).then(
        function (yelpBreakfastItems) {
            if (yelpBreakfastItems===false) { // some error occured during api call
                yelpBreakfastItemsGlobal = [CONSTANTS.NONE_ITEM]; //array because slice is used in userinput.js
            }
            else {
                yelpBreakfastItemsGlobal = yelpBreakfastItems;
            }

            // Find yelp businesses with 'lunch' term
            if (doYelpLunchCalls) {
                return yelpApi.getYelpData(LUNCH, req.body.latlon, client, date, string_date, LUNCH_HOUR, req.body.search_radius_miles);
            }
            else {
                return [CONSTANTS.NONE_ITEM];
            }

        }, function (err) {
            yelpBreakfastItemsGlobal = [CONSTANTS.NONE_ITEM]; //array because slice is used in userinput.js
            return false;
        })
        .catch(function (e) {
            yelpBreakfastItemsGlobal = [CONSTANTS.NONE_ITEM]; //array because slice is used in userinput.js
            console.log(e)
        }) // -------------------------- End yelp lunch restaurants search
        .then(function (yelpLunchItems) {
            if (yelpLunchItems===false || yelpLunchItems===undefined || yelpLunchItems===null) { // some error occured during api call
                yelpLunchItemsGlobal = [CONSTANTS.NONE_ITEM]; //array because slice is used in userinput.js
            }
            else {
                yelpLunchItemsGlobal = yelpLunchItems;
            }

            if (doYelpDinnerCalls) {

                return yelpApi.getYelpData(DINNER, req.body.latlon, client, date, string_date, DINNER_HOUR, req.body.search_radius_miles);
            }
            else {
                return [CONSTANTS.NONE_ITEM]; //array because slice is used in userinput.js
            }

        }, function (err) {
            return false;
        }).catch(function (e) {
            console.log(e)
        }) // -------------------------- End yelp dinner restaurants search
        .then(function (yelpDinnerItems) {
            if (yelpDinnerItems===false || yelpDinnerItems===undefined || yelpDinnerItems===null) { // some error occured during api call
                yelpDinnerItemsGlobal = [CONSTANTS.NONE_ITEM]; //array because slice is used in userinput.js
            }
            else {
                yelpDinnerItemsGlobal = yelpDinnerItems;
            }

            if (doMeetupCalls) {
                // Fulfilled promise returned from getMeetupData is an array of object arrays
                return meetupApi.getMeetupData(req.body.latlon, date, req.body.search_radius_miles, req.body.eventType);
            }
            else {
                var meetupEvents = EMPTY_EVENT_ARRAY;
                return meetupEvents;
            }

        }, function (err) {            
            return err;
        }).catch(function (e) {
            console.log(e)
        }) // -------------------------- End meetup event search
        .then(function (meetupEvents) {
            if (meetupEvents===false || meetupEvents===undefined || meetupEvents===null) { // some error occured during api call
                meetupItemsGlobal = EMPTY_EVENT_ARRAY;
            }
            else {
                meetupItemsGlobal = meetupEvents;
            }

            if (doSeatgeekCalls) {
                // Fulfilled promise returned from getSeatGeekData is an array of object arrays
                return seatgeekApi.getSeatGeekData(req.body.city, date, req.body.search_radius_miles,req.body.latlon);
            }
            else {
                var seatgeekEvents = EMPTY_EVENT_ARRAY;
                return seatgeekEvents;
            }

        }, function (err) {
            meetupItemsGlobal = EMPTY_EVENT_ARRAY;
            return err;
        }).catch(function (e) {
            meetupItemsGlobal = EMPTY_EVENT_ARRAY;
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
                return yelpEvents;
            }

        }, function (err) {
            seatgeekItemsGlobal = EMPTY_EVENT_ARRAY;
            return err;
        }).catch(function (e) {
            seatgeekItemsGlobal = EMPTY_EVENT_ARRAY;
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
                return eventbriteApi.getEventbriteData(req.body.term, req.body.latlon, req.body.city, date, req.body.search_radius_miles, req.body.eventType);              
            }
            else {
                var eventbriteEvents = EMPTY_EVENT_ARRAY;
                return eventbriteEvents;
            }

        }, function (err) {
            yelpEventsGlobal = EMPTY_EVENT_ARRAY;
            return err;
        }).catch(function (e) {
            yelpEventsGlobal = EMPTY_EVENT_ARRAY;
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
                return googlePlacesApi.getGooglePlacesData(req.body.latlon,req.body.search_radius_miles, req.body.eventType);
            }
            else {
                var googlePlacesEvents = EMPTY_EVENT_ARRAY;
                return googlePlacesEvents;
            }

        }, function (err) {
            evenbriteGlobal = EMPTY_EVENT_ARRAY; 
            return err;
        }).catch(function (e) {
            evenbriteGlobal = EMPTY_EVENT_ARRAY; 
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

            var numDataPointsObj = countNumOfDataPoints(events);
            events["numDataPoints"] = numDataPointsObj;

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

function countNumOfDataPoints(apiData_in) {
    // console.log(apiData_in)
    // Determine how many data points there are
    var numMeetupEvents_out = apiData_in.meetupItemsGlobal.Event1.length +
      apiData_in.meetupItemsGlobal.Event2.length +
      apiData_in.meetupItemsGlobal.Event3.length +
      apiData_in.meetupItemsGlobal.Event4.length;
  
    var numYelpEvents_out = apiData_in.yelpEventsGlobal.Event1.length +
      apiData_in.yelpEventsGlobal.Event2.length +
      apiData_in.yelpEventsGlobal.Event3.length +
      apiData_in.yelpEventsGlobal.Event4.length;
  
    var numEventbriteEvents_out = apiData_in.eventbriteGlobal.Event1.length +
      apiData_in.eventbriteGlobal.Event2.length +
      apiData_in.eventbriteGlobal.Event3.length +
      apiData_in.eventbriteGlobal.Event4.length;
  
    var numSeatgeekEvents_out = apiData_in.seatgeekItemsGlobal.Event1.length +
      apiData_in.seatgeekItemsGlobal.Event2.length +
      apiData_in.seatgeekItemsGlobal.Event3.length +
      apiData_in.seatgeekItemsGlobal.Event4.length;
  
    var numGooglePlaces_out = apiData_in.googlePlacesGlobal.Event1.length +
      apiData_in.googlePlacesGlobal.Event2.length +
      apiData_in.googlePlacesGlobal.Event3.length +
      apiData_in.googlePlacesGlobal.Event4.length;
  
    var numYelpBreakfastPlaces_out = apiData_in.yelpBreakfastItemsGlobal.length;
    var numYelpLunchPlaces_out = apiData_in.yelpLunchItemsGlobal.length;
    var numYelpDinnerPlaces_out = apiData_in.yelpDinnerItemsGlobal.length;
  
    var includeYelpEvents = false;
    var numOfEvents_out = numMeetupEvents_out + 
                      numEventbriteEvents_out +
                      numSeatgeekEvents_out +
                      numGooglePlaces_out;                    
    if (includeYelpEvents) {
      numOfEvents_out = numOfEvents_out + numYelpEvents_out;
    }
  
    var numOfFoodPlaces_out = numYelpBreakfastPlaces_out +
                              numYelpLunchPlaces_out +
                              numYelpDinnerPlaces_out;
    return {
      numMeetupEvents: numMeetupEvents_out,
      numYelpEvents: numYelpEvents_out,
      numEventbriteEvents: numEventbriteEvents_out,
      numSeatgeekEvents: numSeatgeekEvents_out,
      numGooglePlaces: numGooglePlaces_out,
      numYelpBreakfastPlaces: numYelpBreakfastPlaces_out,
      numYelpLunchPlaces: numYelpLunchPlaces_out,
      numYelpDinnerPlaces: numYelpDinnerPlaces_out,
      numOfEvents: numOfEvents_out,
      numOfFoodPlaces: numOfFoodPlaces_out,
    }
  }

module.exports = apiRouter;
