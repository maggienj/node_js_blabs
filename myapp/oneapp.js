// OneApp WebApp API
//
// This API is what gives WebApps access to the OneApp messaging infrastructure to
// send and receive messages.
//
// Author: Bart Theeten

'use strict';

// your user id
var oneapp_userId = getParameterByName('userId');
if (!oneapp_userId) {
  console.log("ERROR - No user id found in URL query string, please make sure to add &userId=<userId> to your webApp URL!");
}
// the id of the owner of the web app
var oneapp_ownerId = getParameterByName('owner');
if (!oneapp_ownerId) {
  console.log("No owner given, taking sender to be the owner");
  oneapp_ownerId = getParameterByName('senderId');
}

// the id of this webApp
var oneapp_webAppId = getParameterByName('webAppId');

console.log('userId set to ' + oneapp_userId);
console.log('ownerId set to ' + oneapp_ownerId);
console.log('appId set to ' + oneapp_webAppId);

// BACK CHANNEL to hosting framework (iOS or iFrame parent)

// In order to make sure the Javascript functions have loaded before they
// are triggered from the outside, send an initialization message to they
// parent.
window.onload = function() {
  console.log("WINDOW READY");
  if (window.webkit === undefined) {
    console.log("NOTIFYING PARENT of readyness...");
    window.parent.postMessage({id:'webapp:'+oneapp_webAppId,message:"HELLO"},'*');
  }
};

if (!window.webkit) {
  // listener for postMessage() calls by hosting OneApp container
  // Only used for OneApp Web
  window.addEventListener('message', function(event) {
    console.log("POSTMESSAGE RECEIVED: " + JSON.stringify(event.data));

    // IMPORTANT: Check the origin of the data!
    //    if (~event.origin.indexOf('http://yoursite.com')) {
        // The data has been sent from your site

    if (!event.data.webappCmd) {
      console.log("Ignoring message: no 'webappCmd' field");
      return;
    }
    if ( event.data.webappCmd === 'onChatMessage') {
      console.log("EXECUTING onChatMessage(id=" + event.data.data.id + ", chatThreadId=" + event.data.data.chatThreadId +
        ", userId=" + event.data.data.userId + ", msg=" + event.data.data.msg + ")");
      onChatMessage(event.data.data.id,event.data.data.chatThreadId,event.data.data.userId,event.data.data.msg);
    } else if (event.data.webappCmd === 'getPageSize') {
      console.log("EXECUTING getPageSize()");
      window.parent.postMessage({id:'webapp:'+oneapp_webAppId,message: {'command':'setPageSize','args':[getPageSize()]}},'*');
    }
    else {
      console.log("Ignoring message: no such command: " + event.data.webappCmd);
    }
    //    } else {
        // The data hasn't been sent from your site!
        // Be careful! Do not use it.
    //        return;
    //    }
  });
}


// Sends a message on the current chatThread associated with a WebApp RIM.
// The WIRE backend will deliver this message to all chat thread participants.
//
// @param msg  a dictionary of key-values
function sendDataMessage(msg,webAppInfo)
{
  var chatMsg;
  if (!webAppInfo) {
    chatMsg = { 'command':'sendDataMessage','message':msg, 'webAppInfo': {'id': oneapp_webAppId} };
  }
  else {
    chatMsg = {'command':'sendDataMessage','message':msg, 'webAppInfo':webAppInfo};
  }
  console.log("sending data message: " + JSON.stringify(chatMsg));
  if (window.webkit) {
    window.webkit.messageHandlers.interOp.postMessage(chatMsg);
  } else if (window.parent) {
    window.parent.postMessage({id:'webapp:'+oneapp_webAppId,message:chatMsg},'*');
  } else {
    console.log("NO WEBKIT: couldn't deliver message = " + JSON.stringify(chatMsg));
  }
}

function sendTextMessage(str)
{
  var textMsg = {'command':'sendTextMessage','message':str};
  console.log("sending text message (webappId = " + oneapp_webAppId + ")");
  if (window.webkit) {
    window.webkit.messageHandlers.interOp.postMessage(textMsg);
  } else if (window.parent) {
    window.parent.postMessage({id:'webapp:'+oneapp_webAppId,message:textMsg},'*');
  } else {
    console.log("NO WEBKIT: couldn't deliver message = " + JSON.stringify(textMsg));
  }
}

function sendTextMessageToChatThread(str,chatThreadId)
{
  var textMsg = {'command':'sendTextMessage','message':str,'chatThreadId':chatThreadId};
  console.log("sending text message to chatThread " + chatThreadId);
  if (window.webkit) {
    window.webkit.messageHandlers.interOp.ostMessage(textMsg);
  } else if (window.parent) {
    window.parent.postMessage({id:'webapp:'+oneapp_webAppId,message:textMsg},'*');
  } else {
    console.log("NO WEBKIT or parent: cannot deliver message = " + JSON.stringify(textMsg));
  }
}

// Called when a chat message has been received by a WebApp RIM.
//
// @param id            the message id
// @param chatThreadId  the id of the chat thread the message was posted in
// @param userId        the id of the user that caused this message to be sent
// @param msg           the actual message (a map of key-values)
function onChatMessage(id,chatThreadId,userId,msg)
{
  console.log("received message from user '" + userId + "' in chat thread '" + chatThreadId + "': " + JSON.stringify(msg));
  console.log("NOT IMPLEMENTED");
}

function getUserId()
{
  return oneapp_userId;
}

function getOwnerId()
{
  return oneapp_ownerId;
}

// to access query string parameters
function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

var timer;
var touchDuration = 500;

/**
 * Installs a long-touch gesture recognizer, which calls out to iOS to allow
 * forwarding the message. If the object being touched is in the ignoreList, the
 * gesture is ignored.
 **/
function installLongTouchGestureRecognizer(element,ignoreList)
{
  console.log("installing long touch gesture recognizer on " + element);
  element.addEventListener('touchstart', function(ev) {
    var touchobj = ev.changedTouches[0];
    if (ignoreList.indexOf(touchobj.target.tagName) === -1) {
      ev.preventDefault();
      console.log("TOUCH START");
      timer = setTimeout(function() {
        console.log("LONG TOUCHED!");
        var msg = {'command':'longTouched'};
        if (window.webkit) {
          window.webkit.messageHandlers.interOp.postMessage(msg);
        } else if (window.parent) {
          window.parent.postMessage({id:'webapp:'+oneapp_webAppId,message:msg},'*');
        } else
          console.log("NO WEBKIT: couldn't deliver message = " + JSON.stringify(msg));
      },touchDuration);
    }
  });

  element.addEventListener('touchend', function() {
    if (timer)
      clearTimeout(timer);
  });
}

/**
 * Returns the rendered size of the page.
 **/
function getPageSize()
{
  var height = document.body.offsetHeight;
	if (document.body.scrollHeight > height)
		height = document.body.scrollHeight;
	if (document.documentElement.offsetHeight > height)
		height = document.documentElement.offsetHeight;
	if (document.documentElement.scrollHeight > height)
		height = document.documentElement.scrollHeight;
	return height;
}


// For embedding a WebRTC view in HTML

function hasWebRTCSubView()
{
  var rtcEl = document.getElementById("rtcView");
  if (rtcEl === undefined) {
    return false;
  }
  return true;
}

// returns the x,y coordinates of the top-left corner of the view, as well
// as the view width and height. Returns null if there is no webRTC view.
function getWebRTCSubViewBounds()
{
  var rtcEl = document.getElementById("rtcView");
  if (rtcEl === undefined) {
    return { "error":"no such view" };
  }
  // where x, y are the coordinates within the document of the top-left corner of the view
  return { "x":rtcEl.offsetLeft,"y":rtcEl.offsetTop,"width":rtcEl.offsetWidth,"height":rtcEl.offsetHeight };
}
