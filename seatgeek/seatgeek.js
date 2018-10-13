(function() {
  var root, _endpoint, _request, _url;

  root = typeof exports !== "undefined" && exports !== null ? exports : (this.seatgeek = {});

  _url = 'https://api.seatgeek.com/2'; // Changed from http to https to accommodate the seatgeek
                                       // api doc. -JG

  root.callback = null;

  root.events = function(options, callback) {
    return _request('/events/', options, callback);
  };

  root.performers = function(options, callback) {
    return _request('/performers/', options, callback);
  };

  root.venues = function(options, callback) {
    return _request('/venues/', options, callback);
  };

  root.taxonomies = function(options, callback) {
    return _request('/taxonomies/', options, callback);
  };


  _request = function(resource, options, callback) {
    var http, req, script, url, _format, _ref;
    if (typeof options === "function") {
      callback = options;
      options = {};
    }
    _format = (_ref = options != null ? options.format : void 0) != null ? _ref : 'json';
    if (typeof exports === "undefined" || exports === null) {
      options.callback = 'seatgeek.callback';
      root.callback = callback;
    } else if (!http) {
      http = require('https'); // node js module
                               // Initially when this seatgeek module was installed by using npm
                               // install seatgeak, the line read "require('http'). The module was
                               // old and this line caused an error when making a request.
                               // The seatgeek api documentation required https and so this was
                               // changed to accommodate the api doc. -JG
    }
    url = _endpoint(resource, options);
    if (typeof exports === "undefined" || exports === null) {
      script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = url;
      return document.body.appendChild(script);
    } else {

      req = http.get(url, function(res) {
        var body;
        body = '';
        res.on('data', function(chunk) {
          return body += chunk;
        });
        return res.on('end', function() {
          if (_format === 'json') {
            return callback(null, JSON.parse(body));
          } else {
            return callback(null, body);
          }
        });
      });
      return req.on('error', function(err) {
        return callback(err, null);
      });
    }
  };

  _endpoint = function(resource, params) {
    var endpoint, key, query_string, value;
    endpoint = _url + resource;
    query_string = [];
    for (key in params) {
      value = params[key];
      key = encodeURIComponent(key);
      value = encodeURIComponent(value);
      query_string.push(key + '=' + value);
    }
    if (query_string.length) {
      endpoint += '?' + query_string.join('&');
    }
    //console.log(endpoint);
    return endpoint;
  };

}).call(this);
