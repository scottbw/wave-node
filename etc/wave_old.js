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
 
/**
 * This is an experimental setup that simulates replacing the DWR-based
 * functionality of Wookie's Wave API implementation with one
 * using Node.js, WebSockets, and Redis. This file replaces the DWR-based
 * version of wave.js injected in widgets
 *
 **/
 
/*
 * Setup websockets
 */
 io.setPath('socketio/');
 socket = new io.Socket("localhost", {"port":"8081"}); 
 socket.connect();
 
/*
 * Setup events and callbacks
 */
__state_callback = null;
__participant_callback = null;

 
 socket.addEvent('message', function(data){
    var json = JSON.parse(data);
    // There are two types of data we can get - participants and state
    if (json.type == 'participants'){
        wave.setParticipants(json.data);
        if (__participant_callback) __participant_callback();
    }
    if (json.type == 'state'){

        // Apply delta to current state
        wave.applyPatches(json.data);
        
        //wave.setState(json.data);
        if (__state_callback) __state_callback();
    } 
 });
 
/*
 * State class
 * Implements Google Wave API for gadget wave.State object
 * Would be easier if Google in their wisdom had reused HTML5 Storage
 */
 state = new function State(){
 
    this.map = null;

    this.get = function(key, opt_default){
        map = state.map;
        if (!map||map==null||typeof map == 'undefined'){
            if (opt_default) return opt_default;
            return null;
        }
        obj = map[key];
        if(!obj || obj === null || typeof obj == 'undefined'){
            obj = opt_default;
        }
        return obj;
    }
    
    this.getKeys = function(){
        var keys = [];
        var idx = 0;
        for (key in state.map){
            keys[idx] = key;
            idx++;
        }
        return keys;
    }
    
    this.reset = function(){
        var delta = {};
        var keys = getKeys();
        for (key in keys){
            delta[key]=null;
        }
        wave.submitDelta(delta);
    }
    
    this.submitDelta = function(delta){
        wave.submitDelta(delta);
    }
    
    this.submitValue = function(key,value){
    	var delta = {};
    	delta[key] = value;
    	wave.submitDelta(delta);
    }
    
    this.toString = function(){
        var str = "";
        for (key in state.map){
            str+=key+":"+state.get(key);
        }
        return str;
    }
    
    this.__setState = function(object){
        state.map = object;
    }
    
    this.__applyPatches = function(delta){
        map = state.map;
        if (!map||map==null||typeof map == 'undefined') map = {};
        for (item in delta){
            key = item;
            patch = delta[item]; // the patch 
            text = map[key]; // the original value
            if (!text) text = "";
            if (!patch) {
                map[key] = null;
            } else {
                value = wave.dmp.patch_apply(patch,text);
                map[key] = value[0];
            }
        }
        state.map = map;
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
    // Transform engine
    this.dmp = new diff_match_patch();
    
    this.init = function(){
        // Automatically set the Viewer and Shared Data Key if we're in a Wookie context
        if (window.Widget) {
            if (Widget.preferences) {
                wave.setSharedDataKey(Widget.preferences.sharedDataKey);
                if (Widget.preferences.viewer){
                   wave.__setViewer(JSON.parse(Widget.preferences.viewer));
                }
            }
        }
    }
    
    this.__setViewer = function(viewer){
        this.viewer = viewer;
        this.viewer.getDisplayName = function(){return wave.viewer.Participant.participant_display_name};
        this.viewer.getThumbnailUrl = function(){return wave.viewer.Participant.participant_thumbnail_url};
        this.viewer.getId = function(){return wave.viewer.Participant.participant_id};
        wave.checkReady();
    }
    
    this.setViewer = function(id, name, src){
        viewer = {};
        viewer.Participant = {};
        viewer.Participant.participant_display_name = name;
        viewer.Participant.participant_id = id;
        viewer.Participant.participant_thumbnail_url = src;
        wave.__setViewer(viewer);    
    }
    
    this.setSharedDataKey = function(key){
        this.sharedDataKey = key;
        wave.checkReady();
    }
    
    this.checkReady = function(){
        if (!this.viewer) return false;
        if (!this.sharedDataKey) return false;
        if (!__state_callback) return false;
        if (!__participant_callback) return false;
        wave.handshake();
    }
    
    this.handshake = function(){
        var msg = {};
        msg.idkey = 0;
        if (window.Widget) msg.idkey = Widget.instanceid_key;
        msg.sharedDataKey = wave.sharedDataKey;
        msg.viewer = this.viewer;
        socket.send(JSON.stringify(msg));
    }
    
    this.setState = function(data){
        state.__setState(data);
    }
    
    this.applyPatches = function(delta){
        state.__applyPatches(delta);
    }  
    
    this.setParticipants = function(participants){
        wave.participants = participants;
        for(participant in wave.participants){
            wave.participants[participant].getDisplayName = function(){return this.participant_display_name}
            wave.participants[participant].getThumbnailUrl = function(){return this.participant_thumbnail_url};
            wave.participants[participant].getId = function(){return this.participant_id};        
        }
    }

    
    //////////////////////////////////////////////////
    // State Management
    
    this.getState = function(){
        return state;
    }
    
    this.__createPatch = function(previousValue, newValue){
        return dmp.patch_make(previousValue, newValue);
    }
    
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
                thedelta[key] = this.dmp.patch_make(text, thedelta[key]+'');
            }
            
            var msg = {};
            msg.key = "0";
            if (window.widget) msg.key = Widget.instanceid_key;
            msg.delta = thedelta;
            socket.send(JSON.stringify(msg));    
        }
	}
    
    // Sets the state callback; at this point we'll also do a 
    // state initial load - before this its a bit mean as the
    // widget won't know if its changed from its initial state.
    this.setStateCallback = function(callback, opt_context){
        __state_callback = callback;
        wave.checkReady();
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
        __participant_callback = callback;
        wave.checkReady();
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


    