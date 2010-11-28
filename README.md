# Wave-Node

This is an implementation of the Google Wave Gadget API using Node.js, WebSockets, and a key/value store. 

It uses diff-match-patch to synchronize states across multiple instances: clients send patches to the server, which then propagages the patches to other clients which
apply the patches to their local state model. So no matter how big the state model becomes, each update event is quite small.

## Installation

You need to install Node.js with SocketIO and Keys:

	$ npm install socketio
	$ npm install keys
	$ npm install redis
	
## Client API

Each page or widget wanting to use the service needs to import the following JavaScript files:

diff_match_patch.js
json2.js
socket.io.js
wave.js

In addition you need to call the following methods in your own scripts after importing the wave.js library:

wave.setSharedDataKey(key) : this is the "context identifier" for the pages/widgets that will share state.
wave.setViewer(id, name, icon src) : this is the current user's information

For example:

    wave.setSharedDataKey("SPACE1");
    wave.setViewer("mindyourownbusiness","alice","smileys/rabbit.png");
	
When both have been set, your page/widget will handshake with the server.

You can then use the Wave Gadget API as described at: http://code.google.com/apis/wave/extensions/gadgets/guide.html

## Notes

Note that private states are not supported yet, nor are getHost() or state.clear().