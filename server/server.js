/*
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 * limitations under the License.
 */
 
 
/*
 * This is an experimental setup that simulates replacing the DWR-based
 * functionality of Wookie's Wave API implementation with one
 * using Node.js, WebSockets, and Redis. This file contains the server-side logic.
 */

HOST = null; // localhost
PORT = 8081;

var dmp_lib = require ('./lib/diff_match_patch');
var dmp = dmp_lib.diff_match_patch

var http = require('http');
var io = require('socket.io'); // for npm, otherwise use require('./path/to/socket.io') 

/*
 * Renders a page for HTTP requests
 */
var server = http.createServer(function(req, res){ 
        res.writeHead(200, {'Content-Type': 'text/html'}); 
        res.end('<h1>Wave Gadget API Server</h1>'); 
});
server.listen(PORT, "127.0.0.1");
console.log('Server running at http://127.0.0.1:'+PORT); 

/*
 * Setup connection to nosql server
 *
 * Data Model used for  tuples:
 *
 * {client.sessionId}:{shared data key}
 * {shared data key}_state: {state JSON data}
 * {shared data key}_participant: {participant JSON data}
 *
 * Note we use the "keys" API which supports Redis, nStore, Riak and Mongo
 *
 */ 

var keys = require("keys");

// Use Redis as the default keystore - you can use any supported
// stores instead.
var store = new keys.Redis();
store.clear();  // Clean the key store on start (for debugging) 

/* 
 * State management
 */
 
// Persist state after updates
function saveState(sharedDataKey, state){
    store.set(sharedDataKey+"_state", JSON.stringify(state));
}
// Create a JSON message to return state data to the client
function stateToJSON(state){
    var msg = {};
    msg.type="state";
    msg.data=state;
    return JSON.stringify(msg);
}
// Process a Delta
function submitDelta(client, delta){
     var id = client.sessionId;
     store.get(id, function(err, sharedDataKey){
        if (err) console.log(err);
        store.get(sharedDataKey+"_state", function(err, data){
            if (err || !data) {
                state = {};
            } else {
                state = JSON.parse(data);
            }
            // Apply patches
            for (item in delta){
                key = item;
                patch = delta[item];
                text = state[key];
                if (!text) text = "";
                if (!patch || patch == null || typeof(patch)=="undefined") {
                    state[key] = null;
                } else {
                    value = dmp.patch_apply(patch,text);
                    state[key]=value[0];
                }
            }

            // Save state
            saveState(sharedDataKey, state);
            // Propagate changes to connected sibling clients
            notifySiblings(sharedDataKey, stateToJSON(delta));
            // Or just tell all connected clients...
            //socket.broadcast(stateToJSON(state));
        });
     });
}

/* 
 * Participant management
 */
 
// Create a JSON message to return participants data to clients
function participantsToJSON(participants){
    var msg = {};
    msg.type="participants";
    msg.data=participants;
    return JSON.stringify(msg);
}
 
// Persist a participant
function saveParticipants(sharedDataKey, participant){
    store.set(sharedDataKey+"_participants", JSON.stringify(participant));
}

// Process adding a participant
function addParticipant(client, sharedDataKey, participant){
    store.get(sharedDataKey+"_participants", function(err, data){
        if (err || !data) {
            participants = {};
        } else {
            participants = JSON.parse(data);
        }
        // Add participant if not already present
        if (!participants[participant.participant_id]) {
            // Add session id for this participant so we can remove it
            // when the client disconnects
            participant.sessionId = client.sessionId;
            participants[participant.participant_id]=participant;
            saveParticipants(sharedDataKey, participants);
            notifySiblings(sharedDataKey, participantsToJSON(participants));        
        }
    });
} 

// Remove a participant, and notify siblings of the change
function removeParticipant(sessionId){
    store.get(sessionId, function(err, key){
        if (err || !key) return false;
        sharedDataKey = key.toString();
        store.get(sharedDataKey+"_participants", function(err, data){
            if (err || !data) {
                participants = {};
            } else {
                participants = JSON.parse(data);
            }
            // Remove participant if present
            for (participant in participants){
                if (participants[participant].sessionId == sessionId) {
                    delete participants[participant];
                    saveParticipants(sharedDataKey, participants);
                    notifySiblings(sharedDataKey, participantsToJSON(participants));        
                }            
            }

        });

    });
}

/* 
 * Client management
 */

// The array of currently-connected websocket clients
var clients = []

// Register the client
function registerClient(client, sharedDataKey){
     
    // Add client to global clients list
    clients.push(client);
        
    // Send initial state data to the client
    store.get(sharedDataKey+"_state", function(err, state){
        if (state){
            var patch = createInitialPatch(state);
            client.send(stateToJSON(patch));
        } else {
            client.send(stateToJSON({}));
        }       
    });

    // Send initial participant data to the client
    store.get(sharedDataKey+"_participants", function(err, participants){
        if (participants) client.send(participantsToJSON(JSON.parse(participants)));        
    });
    
    // Save the client details
    store.set(client.sessionId, sharedDataKey);
}


function createInitialPatch(state){
    var thedelta = {};
    var thestate = JSON.parse(state);

    // Create a patch for each item in the state
    for (key in thestate) {
        var text = thestate[key];
        if (!text) text = "";
        thedelta[key] = dmp.patch_make("", text);
    }
    
    return thedelta;
}


// Pushes a message to all clients with the same sharedDataKey
function notifySiblings(sharedDataKey, message){
    for (i in clients){
        notify(clients[i], sharedDataKey, message);
    }
}
function notify(target, sharedDataKey, message){
    store.get(target.sessionId, function(err, key){
        key = key.toString();
        if (key == sharedDataKey) target.send(message);
    });
}

/*
 * Socket configuration
 *
 * This sets up a socketio server with event handlers
 * for connection, messages and disconnection.
 * 
 * The socket interface expects two kinds of messages 
 * to br received - either "registration" messages
 * containing an idkey property, or deltas for updating
 * the state model.
 */
// socket.io 
var socket = io.listen(server); 
socket.on('connection', function(client){ 
  // Got a message
  client.on('message', function(message){ 
        var messageJSON = JSON.parse(message);
        // register client
        if (messageJSON.sharedDataKey){
            registerClient(client, messageJSON.sharedDataKey);
            addParticipant(client, messageJSON.sharedDataKey, messageJSON.viewer.Participant);
        } else {
            // delta
            submitDelta(client, messageJSON.delta);
        }
  }) 
  // De-register the client on disconnect
  client.on('disconnect', function(){

    // Remove the client from the array of currently connected clients
    // This will stop us trying to send notifications to it
    var sessionId = client.sessionId;
    clients = clients.filter(function(client){ if (client.sessionId == sessionId) return false; return true });

    // Remove participant associated with the client
    removeParticipant(sessionId);
  }) 
}); 