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

function Server(){
    this.dmp = require ('./diff_match_patch').diff_match_patch; // the DMP processor
    this.store = {}; // the key store we're using
    this.clients = []; // the current connected clients
}

exports.Server = new Server();

Server.prototype.attach = function(server, options){
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
    options = options || {};
    var keys = require("keys");

    // Use Redis as the default keystore - you can use any supported
    // stores instead by editing this code.
    this.store = new keys.Redis(options);
    if (options.clear) this.store.clear();  // Clear the store

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
     // The array of currently-connected websocket clients
    // socket.io 
    var that = this;
    var io = require('socket.io'); // for npm, otherwise use require('./path/to/socket.io') 
    var socket = io.listen(server); 
    socket.on('connection', function(client){ 
      // Got a message
      client.on('message', function(message){ 
            var messageJSON = JSON.parse(message);
            // register client
            if (messageJSON.sharedDataKey){
                that.registerClient(client, messageJSON.sharedDataKey);
                that.addParticipant(client, messageJSON.sharedDataKey, messageJSON.viewer.Participant);
            } else {
                // delta
                that.submitDelta(client, messageJSON.delta);
            }
      }); 
      // De-register the client on disconnect
      client.on('disconnect', function(){

        // Remove the client from the array of currently connected clients
        // This will stop us trying to send notifications to it
        var sessionId = client.sessionId;
        that.clients = that.clients.filter(function(client){
         if (client.sessionId == sessionId) return false; 
         return true;
        });

        // Remove participant associated with the client
        that.removeParticipant(sessionId);
      }); 
    }); 
};


/*
 * Catch any uncaught exceptions
 */
process.on('uncaughtException', function (err) {
  if (err.message.indexOf("Redis connection")!=-1){
    console.log("ERROR: You need to start your Redis server before starting Wave-Node");
    process.exit(code=1);
  } else {
    console.log(err);
    process.exit(code=1);
  } 
});


/* 
 * State management
 */
 
// Persist state after updates
Server.prototype.saveState = function(sharedDataKey, state){
    this.store.set(sharedDataKey+"_state", JSON.stringify(state));
};
// Create a JSON message to return state data to the client
Server.prototype.stateToJSON = function(state){
    var msg = {};
    msg.type="state";
    msg.data=state;
    return JSON.stringify(msg);
};
// Process a Delta
Server.prototype.submitDelta = function(client, delta){
     var id = client.sessionId;
     var state;
     var that = this;
     this.store.get(id, function(err, sharedDataKey){
        if (err) console.log(err);
        that.store.get(sharedDataKey+"_state", function(err, data){
            if (err || !data) {
                state = {};
            } else {
                state = JSON.parse(data);
            }
            // Apply patches
            for (var item in delta){
                var key = item;
                var patch = delta[item];
                var text = state[key];
                if (!text) text = "";
                if (!patch || patch === null || typeof(patch)=="undefined") {
                    state[key] = null;
                } else {
                    var value = that.dmp.patch_apply(patch,text);
                    state[key]=value[0];
                }
            }

            // Save state
            that.saveState(sharedDataKey, state);
            // Propagate changes to connected sibling clients
            that.notifySiblings(sharedDataKey, that.stateToJSON(delta));
            // Or just tell all connected clients...
            //socket.broadcast(stateToJSON(state));
        });
     });
};

/* 
 * Participant management
 */
 
// Create a JSON message to return participants data to clients
Server.prototype.participantsToJSON = function(participants){
    var msg = {};
    msg.type="participants";
    msg.data=participants;
    return JSON.stringify(msg);
};
 
// Persist a participant
Server.prototype.saveParticipants = function(sharedDataKey, participant){
    this.store.set(sharedDataKey+"_participants", JSON.stringify(participant));
};

// Process adding a participant
Server.prototype.addParticipant = function(client, sharedDataKey, participant){
    var that = this;
    this.store.get(sharedDataKey+"_participants", function(err, data){
        var participants;
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
            that.saveParticipants(sharedDataKey, participants);
            that.notifySiblings(sharedDataKey, that.participantsToJSON(participants));        
        }
    });
};

// Remove a participant, and notify siblings of the change
Server.prototype.removeParticipant = function(sessionId){
    var that = this;
    this.store.get(sessionId, function(err, key){
        if (err || !key) return false;
        var sharedDataKey = key.toString();
        var participants;
        that.store.get(sharedDataKey+"_participants", function(err, data){
            if (err || !data) {
                participants = {};
            } else {
                participants = JSON.parse(data);
            }
            // Remove participant if present
            for (var participant in participants){
                if (participants[participant].sessionId == sessionId) {
                    delete participants[participant];
                    that.saveParticipants(sharedDataKey, participants);
                    that.notifySiblings(sharedDataKey, that.participantsToJSON(participants));        
                }            
            }

        });

    });
};

/* 
 * Client management
 */

// Register the client
Server.prototype.registerClient = function(client, sharedDataKey){
    // Add client to global clients list
    this.clients.push(client);
        
    var that = this;
    // Send initial state data to the client
    this.store.get(sharedDataKey+"_state", function(err, state){
        if (state){
            var patch = that.createInitialPatch(state);
            client.send(that.stateToJSON(patch));
        } else {
            client.send(that.stateToJSON({}));
        }       
    });

    // Send initial participant data to the client
    this.store.get(sharedDataKey+"_participants", function(err, participants){
        if (participants) client.send(that.participantsToJSON(JSON.parse(participants)));        
    });
    
    // Save the client details
    this.store.set(client.sessionId, sharedDataKey);
};


Server.prototype.createInitialPatch = function(state){
    var thedelta = {};
    var thestate = JSON.parse(state);

    // Create a patch for each item in the state
    for (var key in thestate) {
        var text = thestate[key];
        if (!text) text = "";
        thedelta[key] = this.dmp.patch_make("", text);
    }
    
    return thedelta;
};


// Pushes a message to all clients with the same sharedDataKey
Server.prototype.notifySiblings = function(sharedDataKey, message){
    for (var i in this.clients){
        this.notify(this.clients[i], sharedDataKey, message);
    }
};
Server.prototype.notify = function(target, sharedDataKey, message){
    this.store.get(target.sessionId, function(err, key){
        key = key.toString();
        if (key == sharedDataKey) target.send(message);
    });
};
