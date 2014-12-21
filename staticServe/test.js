function createCORSRequest(method, url) {
  var xhr = new XMLHttpRequest();
  if ("withCredentials" in xhr) {

    // Check if the XMLHttpRequest object has a "withCredentials" property.
    // "withCredentials" only exists on XMLHTTPRequest2 objects.
    xhr.open(method, url, true);

  } else if (typeof XDomainRequest != "undefined") {

    // Otherwise, check if XDomainRequest.
    // XDomainRequest only exists in IE, and is IE's way of making CORS requests.
    xhr = new XDomainRequest();
    xhr.open(method, url);

  } else {

    // Otherwise, CORS is not supported by the browser.
    xhr = null;

  }
  return xhr;
}

function put(_url, _data, _callback){

  var xhr = createCORSRequest('PUT',_url);
  if (!xhr){
    throw new Error('CORS not supported');
  }

  xhr.send(_data);

  /*SUCCESS -- do somenthing with data*/
  xhr.onload = function(){
    // process the response.
    _callback(xhr.responseText);
  };

  xhr.onerror = function(e){
    console.log(e);
  };
}

function getJSON(_url, _callback, _error){

  var xhr = createCORSRequest('GET',_url);
  if (!xhr){
    throw new Error('CORS not supported');
  }
  xhr.send();

  /*SUCCESS -- do somenthing with data*/
  xhr.onload = function(){
    // process the response.
    if(xhr.status == '404') {
    	_error(xhr.responseText);
	} else {
	    _callback(xhr.responseText);
	}
  };

  xhr.onerror = function(e){
    _error(e);
  };
}

var defaultData = {
	title : "Lorem Ipsum",
	desc : "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
	timesRead: 0
}

getJSON('testDir/test2.json', function(response) {
		defaultData = JSON.parse(response);
		console.log(defaultData);
		if(defaultData.timesRead === undefined) defaultData.timesRead = 1;
		defaultData.timesRead++;
		put('testDir/test2.json', JSON.stringify(defaultData), function(response) {
			console.log(response);
		})
	},
	function(response) {
		console.log(response);
		put('testDir/test2.json', JSON.stringify(defaultData), function(response) {
			console.log(response);
		});
	}
);