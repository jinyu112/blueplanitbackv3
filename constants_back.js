module.exports = {
    DEFAULT_SEARCH_RADIUS_MI: 50,
    MILES_TO_METERS: 1609.34, // 1 mile = 1609.34 meters
    MAX_YELP_SEARCH_RADIUS: 40000,
    NONE_ITEM_EVENT: {
        name: "None/Free Itinerary Slot",
        cost: 0,
        rating: 10.4,
        time: "9999",
        location: {},
        origin: 'noneitem',
        other: 0, //a field for misc info
      },

      NONE_ITEM: {
        name: "None/Free Itinerary Slot",
        cost: 0,
        rating: 4.0,
        time: "9999",
        location: {},
        origin: 'noneitem',
        other: 0,
      },
      NOCOST_EVENT_COST: 20, //set a $20 cost for events that don't have costs associated with them
      EB_EVENTTYPE_SEARCHKEYS: [
        '',
        '103,104,106,110', //party,networking/premier,fashion show,dance
        '108', //sports
        '109,114', // tourism
        '113,105', // interest groups,talks/poetry
    ],
    MU_EVENTTYPE_SEARCHKEYS: [
        '',
        'night life', //party,networking/premier,fashion show,dance
        'outdoor', //sports
        'tourism', // tourism
        'art', // art
    ],
    GP_EVENTTYPE_SEARCHKEYS: [
        'park',
        'bar', 
        'park', 
        'amusement_park', 
        'museum', 
    ],
    BREAKFAST_HOUR:  9, // hours from 12:00am
    LUNCH_HOUR: 13,  // 1 pm
    DINNER_HOUR: 18, // 6 pm
    BREAKFAST: "Breakfast",
    LUNCH: "Lunch",
    DINNER: "Dinner",
}
