module.exports = {
    // ------------- Misc functions

    getRndInteger: function(min, max) { // icluding min, excluding max
        return Math.floor(Math.random() * (max - min)) + min;
    },

    // Returns a date string in the YYYY-MM-DDTHH:MM:SS format with date input, converts it to that date at
    // zero hours and adds "daysAhead" plus 26 hours (effectively 2 am).
    // This function is used in the meetup API call
    getDate: function(date, daysAhead) {
        var today = new Date(date);
        today.setDate(today.getDate() + daysAhead + 1);
        var dd = today.getDate();
        var mm = today.getMonth() + 1; //January is 0!
        var yyyy = today.getFullYear();

        if (dd < 10) {
            dd = '0' + dd
        }

        if (mm < 10) {
            mm = '0' + mm
        }
        return yyyy + '-' + mm + '-' + dd + 'T02:00:00'; // 2:00 am the next day
    },

    isEmpty: function(obj) {
        for(var key in obj) {
            if(obj.hasOwnProperty(key))
                return false;
        }
        return true;
    },

    // Processes the lat/long string and returns an array of two floats
    processLocationString: function(locStr) {
        var splitLocStr = locStr.split(',');
        var lat = parseFloat(splitLocStr[0]);
        var long = parseFloat(splitLocStr[1]);
        var latLonArray = [lat, long];
        return latLonArray;
    },

    // Get the military time out from the date
    // input format is like: Sun Dec 31 2017 10:00:00 GMT-0500 (STD)
    processTime: function (time) {
        time = time.substring(16,21); // hard coded !!! may want to do some checks
        return time = time.replace(":","");
    },

    // Get the military time out from the date
    // input format is like: 2018-01-06T10:00:00
    processTimeSG: function (time) {
        time = time.substring(11,16); // hard coded !!! may want to do some checks
        return time = time.replace(":","");
    },

    // Get the military time out from the local_time field
    processTimeMU: function (time,istrt,istop) {
        time = time.substring(istrt,istop); 
        return time = time.replace(":","");
    },

    // Get the date from the following input
    // input format is like: 2018-01-06T10:00:00
    processDateSG: function (time) {
        time = time.substring(0,10); // hard coded !!! may want to do some checks
        return time = time.replace(":","");
    },

    round2NearestHundredth: function (number) {
        return Math.round(100*number)/100;
    },

    round2NearestTenth: function (number) {
        return Math.round(10*number)/10;
    }
}
