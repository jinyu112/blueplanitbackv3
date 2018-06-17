'use strict';
const express = require('express');
const emailRouter = express.Router();
const email = require('emailjs');
const MISC = require('../miscfuncs/misc.js');

// you can continue to send more messages with successive calls to 'server.send',
// they will be queued on the same smtp connection

// or you can create a new server connection with 'email.server.connect'
// to asynchronously send individual emails instead of a queue


//Search for business
emailRouter.post('/', (req, res, next) => {

    var server 	= email.server.connect({
       user:	 process.env.EMAIL,
       password: process.env.EMAIL_PASS,
       host:	"smtp.gmail.com",
       ssl:		true
    });

    var emailTemplate;
    var results = req.body.message;
    emailTemplate =  '<html style="margin: 0; padding: 0;">';
    emailTemplate += '<head><link type="text/css" rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700">';
    emailTemplate += '</head><body style="background-color: #e8f3f9; padding: 4em 5em; font-size: 1.2em; font-family: Roboto;">';
    emailTemplate += '<div style="background-color: white; padding: 2em 10em 4em;">';
    emailTemplate += '<h3 style="font-size: 2em; margin-bottom: 0px; text-align: center">Your Itinerary</h3>';
    emailTemplate += `<p style="font-size: 1.3em; margin-top: 0px; margin-bottom: 0px; text-align: center">Destination: ${req.body.location}</p>`;
    emailTemplate += `<p style="font-size: 1.3em; margin-top: 0px; text-align: center">Approximate Total: $${req.body.total}</p>`;
    emailTemplate += `<hr style="color: #f1f1f1; width: 30%; margin:auto; margin-top: 3em; margin-bottom: 3em;"/>`;
    emailTemplate += '<table >';
    for(var i = 0; i < results.length; i++) {
        emailTemplate += `<tr style="padding: 2em 0; ">
            <td style="text-align: center; padding: 2em 0; border-bottom: 1px solid #f1f1f1; min-width: 150px; margin:auto"><strong>${ results[i].time == 'Food' ? results[i].time : MISC.convertMilTime(results[i].time) }</strong></td>
            <td style="padding: 2em 0; border-bottom: 1px solid #f1f1f1; padding: 10px 8px; font-size: 1.2em;">
               <a style="text-decoration: none" href="${results[i].url}" target='_blank'> ${results[i].name}</a>
            </td>
            <td style="padding: 2em 0; border-bottom: 1px solid #f1f1f1;"><strong>$${results[i].cost}</strong></td>
           </tr>`
    }
    emailTemplate += '</table>';
    emailTemplate += '</div>';
    emailTemplate +=  '</body>';
    emailTemplate += '</html>';

    var message	= {
       text:	'Itinerary',
       from:	"Blue Planit <blueplanitco@gmail.com>",
       to:		req.body.email,
       subject:	"Your Blue Planit Itinerary for " + req.body.location,
       attachment:
       [
           {data: emailTemplate, alternative: true},

       ]
    };

    // send the message and get a callback with an error or details of the message that was sent
    server.send(message, function(err, message) { console.log(err || message); });

});

module.exports = emailRouter;
