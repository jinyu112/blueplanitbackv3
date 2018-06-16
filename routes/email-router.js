'use strict';
const express = require('express');
const emailRouter = express.Router();
const email = require('emailjs');

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

    var message	= {
       text:	req.body.message,
       from:	"hi <blueplanitco@gmail.com>",
       to:		"someone <aliguan726@gmail.com>",
       cc:		"else <else@your-email.com>",
       subject:	"testing emailjs",
    };

    // send the message and get a callback with an error or details of the message that was sent
    server.send(message, function(err, message) { console.log(err || message); });

});

module.exports = emailRouter;
