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
 * State class
 * Implements Google Wave Gadget API for gadget wave state object
 */
 state = new function State(){
 
    this.map = null;

    // Return a single value
    this.get = function(key, opt_default){
        if (!state.map||state.map==null||typeof state.map == 'undefined'){
            if (opt_default) return opt_default;
            return null;
        }
        obj = state.map[key];
        if(!obj || obj === null || typeof obj == 'undefined'){
            obj = opt_default;
        }
        return obj;
    }
    
    // Return all keys in the map
    this.getKeys = function(){
        var keys = [];
        var idx = 0;
        for (key in state.map){
            keys[idx] = key;
            idx++;
        }
        return keys;
    }
    
    // Clear all tuples
    this.reset = function(){
        var delta = {};
        var keys = getKeys();
        for (key in keys){
            delta[key]=null;
        }
        wave.submitDelta(delta);
    }
    
    // Submit an array of tuples
    this.submitDelta = function(delta){
        wave.submitDelta(delta);
    }
    
    // Submit a single tuple
    this.submitValue = function(key,value){
    	var delta = {};
    	delta[key] = value;
    	wave.submitDelta(delta);
    }
    
    // Pretty-print the state map
    this.toString = function(){
        var str = "";
        for (key in state.map){
            str+=key+":"+state.get(key);
        }
        return str;
    }
    
    // Applies a set of patches to the internal state map
    this.__applyPatches = function(delta){
        if (!state.map||state.map==null||typeof state.map == 'undefined') state.map = {};
        for (item in delta){
            key = item;
            patch = delta[item]; // the patch 
            text = state.map[key]; // the original value
            if (!text) text = "";
            if (!patch) {
                state.map[key] = null;
            } else {
                value = wave.dmp.patch_apply(patch,text);
                state.map[key] = value[0];
            }
        }
    }
 }

/*
 * Wave, singleton class
 * Implements Google Wave API for "gadgets"
 *
 */
 wave = new function Wave(){
 	this.participants = null;
 	this.viewer = null;
    this.isInWaveContainer = function(){ return true};
    this.dmp = new diff_match_patch();
    this.socket = null;
    this.state_callback = null;
    this.participant_callback = null;
    
    //////////////////////////////////////////////////
    // Initialize the wave client
    // 
    this.init = function(){
        // Automatically set the Viewer and Shared Data Key if we're in a Wookie context
        if (window.Widget) {
            if (widget.viewerId){
                wave.setSharedDataKey(widget.preferences.sharedDataKey);
                wave.setViewer(widget.viewerId, widget.viewerDisplayName, widget.viewerThumbnailUrl);
            }
        }
        
        // Setup websockets
        io.setPath('socketio/');
        this.socket = new io.Socket("localhost", {"port":"8081"}); 
        this.socket.connect();
         
        //Setup events and callbacks
        this.socket.addEvent('message', function(data){
            var json = JSON.parse(data);
            // There are two types of data we can get - participants and state
            if (json.type == 'participants'){
                wave.__setParticipants(json.data);
                if (wave.participant_callback) wave.participant_callback();
            }
            if (json.type == 'state'){
                // Apply delta to current state
                wave.getState().__applyPatches(json.data);
                //wave.setState(json.data);
                if (wave.state_callback) wave.state_callback();
            } 
         });
    }
    
    //////////////////////////////////////////////////
    // Context Management
    // These methods are used to initialize the wave
    // client. Only when the viewer, shared data key,
    // state callback and participant callback have
    // been set is the client started
    
    // Set the viewer of this widget
    this.setViewer = function(id, name, src){
        viewer = {};
        viewer.Participant = {};
        viewer.Participant.participant_display_name = name;
        viewer.Participant.participant_id = id;
        viewer.Participant.participant_thumbnail_url = src;
        wave.__setViewer(viewer);    
    }
    
    // Internal method for setting up viewer functions
    this.__setViewer = function(viewer){
        this.viewer = viewer;
        this.viewer.getDisplayName = function(){return wave.viewer.Participant.participant_display_name};
        this.viewer.getThumbnailUrl = function(){return wave.viewer.Participant.participant_thumbnail_url};
        this.viewer.getId = function(){return wave.viewer.Participant.participant_id};
        wave.__checkReady();
    }
    
    // Set the shared data key (context identifier) of this widget (e.g. the wave id)
    this.setSharedDataKey = function(key){
        this.sharedDataKey = key;
        wave.__checkReady();
    }
    
    // Called to check if we have everything we need to register with the
    // server and start sending data
    this.__checkReady = function(){
        if (!this.viewer) return false;
        if (!this.sharedDataKey) return false;
        if (!this.state_callback) return false;
        if (!this.participant_callback) return false;
        wave.__handshake();
    }
    
    // Send initial data to the server
    this.__handshake = function(){
        var msg = {};
        msg.idkey = 0;
        if (window.Widget) msg.idkey = Widget.instanceid_key;
        msg.sharedDataKey = wave.sharedDataKey;
        msg.viewer = this.viewer;
        this.socket.send(JSON.stringify(msg));
    }
    
    // Update the internal participants array
    this.__setParticipants = function(participants){
        wave.participants = participants;
        for(participant in wave.participants){
            wave.participants[participant].getDisplayName = function(){return this.participant_display_name}
            wave.participants[participant].getThumbnailUrl = function(){return this.participant_thumbnail_url};
            wave.participants[participant].getId = function(){return this.participant_id};        
        }
    }

    //////////////////////////////////////////////////
    // State Management
    
    // Return the State object
    this.getState = function(){
        return state;
    }
    
    // Send a delta back to the server using socket.io
    this.submitDelta = function(delta){
        if (delta && delta!=null){
            // hack to force into a map
            var thedelta = {};
            for (object in delta){
                thedelta[object] = delta[object];
            }
            
            // Create a patch for each delta item in the map
            for (key in thedelta) {
                var text = this.getState().get(key);
                if (!text) text = '';
                if (thedelta[key])
                   thedelta[key] = this.dmp.patch_make(text, thedelta[key]+'');
            }
            
            var msg = {};
            msg.key = "0";
            if (window.widget) msg.key = Widget.instanceid_key;
            msg.delta = thedelta;
            this.socket.send(JSON.stringify(msg));    
        }
	}
    
    // Sets the state callback
    this.setStateCallback = function(callback, opt_context){
        this.state_callback = callback;
        wave.__checkReady();
    }
    
    //////////////////////////////////////////////////
    // Participants
    
    this.getParticipants = function(){
 		return this.participants;
 	}
    
 	this.getViewer = function(){
 		return this.viewer;
 	}
    
    this.getHost = function(){
        return null; // NOT IMPLEMENTED
    }
    
    this.getParticipantById = function(id){
        for (x=0;x<this.participants.length;x++){
            if (this.participants[x].getId() == id) return this.participants[x];
        }
        return null;
    }
    
    this.setParticipantCallback = function(callback, opt_context){
        this.participant_callback = callback;
        wave.__checkReady();
    }
    
    //////////////////////////////////////////////////
    // Playback = NOT YET IMPLEMENTED
    this.getTime = function(){
        return null;
    }
    
    this.isPlayback = function(){ return false};
 }
 
 // very important !
wave.init();


    