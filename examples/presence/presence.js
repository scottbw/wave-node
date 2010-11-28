/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 * 
 *      http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var isActive=false;
var username="";
var usercolor="";
var chatSeparator = "<chat>";
var dataSeparator = "<data>";
var memberSeparator = "<member>";
var thumbnail="";
var userList="";
function rnd_no(max){
    return Math.floor(Math.random()*max);
};
	
// on start up set some values & init with the server
function init() {
    wave.setStateCallback(function(){});
    wave.setParticipantCallback(refreshPresenceList);
 	setChatArea();
}


///// Chat List

function refreshPresenceList(){
    var list = "";
        for (var participant in wave.getParticipants()) {
            var icon = wave.getParticipants()[participant].getThumbnailUrl();
            var name = wave.getParticipants()[participant].getDisplayName();
            list = formatParticipant(icon, name) + list;
        }
    var objDiv = document.getElementById("presence");
    objDiv.innerHTML = list;
    objDiv.scrollTop = objDiv.scrollHeight;
}

function formatParticipant(icon, name){
    var iconElem = "<img class=\"icon\" src=\""+icon+"\">";
    var message = "<div class=\"post\">"+iconElem+"<span class=\"who\">"+name+"</span><br clear=\"both\"/></div>"
	return message;
}

//
// Resize the chat area if the window resizes
//
window.onresize = function(event) {
	setChatArea();
}

//
// Make the chat area fill available space (pushes input box to bottom of window)
//
function setChatArea(){
    var objDiv = document.getElementById("presence");
    objDiv.style.height = getHeight() - 30 + 'px';
    objDiv.scrollTop = objDiv.scrollHeight;
}

//
// Get the viewport height
//
function getHeight() {
  var myHeight = 0;
  if( typeof( window.innerWidth ) == 'number' ) {
    //Non-IE
    myHeight = window.innerHeight;
  } else if( document.documentElement && ( document.documentElement.clientWidth || document.documentElement.clientHeight ) ) {
    //IE 6+ in 'standards compliant mode'
    myHeight = document.documentElement.clientHeight;
  } else if( document.body && ( document.body.clientWidth || document.body.clientHeight ) ) {
    //IE 4 compatible
    myHeight = document.body.clientHeight;
  }
  return myHeight;
}