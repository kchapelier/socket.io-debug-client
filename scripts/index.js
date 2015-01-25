var $settings         = document.querySelector('#settings');
var $settingsURL      = document.querySelector('#settings #url');
var $timeline         = document.querySelector('#timeline'); 
var $emitter          = document.querySelector('#emitter');
var $eventType        = $emitter.querySelector('[name=eventType]');
var $eventData        = $emitter.querySelector('[name=eventData]');
var $jsonpreview      = $emitter.querySelector('#jsonpreview');
var timeline          = new Timeline($timeline); 

var _socket; 

$settings.onsubmit = function(event) {
  var url = $settingsURL.value;
  connect(url);
  event.preventDefault();
  timeline.clear();
};
function connect(url) {
  console.log("connecting to: ",url);
  if(_socket) {
    _socket.disconnect();
    _socket.removeAllListeners();
  }
  _socket = io(url);
  _socket.on('connect',function() {
    timeline.addSuccess('connect',url);
  });
  _socket.on('connect_error',function(err) {
    timeline.addError('connect_error',err);
  });
  _socket.on('connect_timeout',function() {
    timeline.addError('connect_timeout');
  });
  _socket.on('reconnect',function(num) {
    timeline.addSuccess('reconnect',num);
  });
  _socket.on('reconnect_attempt',function() {
    timeline.addWarning('reconnect_attempt');
  });
  _socket.on('reconnecting',function(num) {
    timeline.addWarning('reconnecting',num);
  });
  _socket.on('reconnect_error',function(err) {
    timeline.addError('reconnect_error',err);
  });
  _socket.on('reconnect_failed',function() {
    timeline.addError('reconnect_failed');
  });
  _socket.on('error',function(err) {
    timeline.addError('error',err);
  });
  anyEventCreator(_socket);
  _socket.on("any",function(eventType,data) {
    timeline.receivedEvent(eventType,data);
  }); 
}

$eventData.onfocus = function(event) {
  $jsonpreview.classList.add('show');
  this.onkeyup = function(event) {
    try {
      var json = YAML.parse(this.value);
      $jsonpreview.textContent = JSON.stringify(json, undefined, 2);
      $jsonpreview.classList.remove('parseerror');
    } catch(err) {
      $jsonpreview.textContent = err;
      $jsonpreview.classList.add('parseerror');
    }
  };
};
$eventData.onblur = function(event) {
  this.onchange = null;
  $jsonpreview.classList.remove('show');
};

$emitter.onsubmit = function(event) {
  sendMessage($eventType.value,YAML.parse($eventData.value));
  event.preventDefault();
};

function sendMessage(type,data) {
  if(!_socket) return;
  _socket.emit(type,data,function(response) {
    timeline.receivedResponse(response);
  });
  timeline.sendEvent(type,data);
}


