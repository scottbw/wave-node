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

var player_location = [1,1];
var player = {};
player.x = 1;
player.y = 1;
player.className = window.player_class;

// on start up set some values & init with the server
function init() {
    setupMapArea();
    setupKeys();
    ///
    wave.setStateCallback(refreshGame);
    wave.setParticipantCallback(refreshPlayers);
}


// Enable key actions
function setupKeys(){
    document.onkeypress=handleKeypress
}

function handleKeypress(e){
    var unicode=e.keyCode? e.keyCode : e.charCode;
    var actualkey=String.fromCharCode(unicode)
    var x = player.x;
    var y = player.y;
    
    
    if (actualkey == "w") y--;
    if (actualkey == "a") x--;
    if (actualkey == "s") y++;
    if (actualkey == "d") x++;
    
    if (canMoveTo(x,y)){
        player.x = x;
        player.y = y;
        updatePlayer();
    }
}

function canMoveTo(x,y){
    var target = map[y][x];
    
    if (containsPlayer(x,y)) return false;
    
    if (containsMonster(x,y)){
     return attack(x,y);
    }
    
    if (target == "floor"){
     return true;
    }
    if (target == "open_door"){
     return true;
    }
    // Doors
    if (target == "door"){
        // Open the door
        map[y][x] = "open_door";
        sendMessage("smash!");
        sendMapChanges();
    }
    // Lava
    if (target == "lava"){
        sendMessage("aaaarggh!! It burns!!");
    }
                
    return false;
}

function attack(x,y){
    var ret = false;
    monster = monsterAt(x,y);
    sendMessage("you attack the "+monster.name);
    monster.health--;
    if (monster.health == 0){
        sendMessage("you killed the "+monster.name+"!");    
        removeMonster(monster);
        ret = true;
    }
    return ret;
}

function containsPlayer(x,y){
  players = getPlayers();
  for (player_id in players){
    if(players[player_id].x == x && players[player_id].y == y) return true;
  }
  return false;
}

// Updates player changes, and we also send monster
// info as this could also have altered as a result of their move
function updatePlayer(){
    player.id = wave.getViewer().getId();
    player.playerName = wave.getViewer().getDisplayName();
    setInfo(player.playerName);
    var delta = {};
    delta[player.id]=JSON.stringify(player);
    delta["monsters"]=JSON.stringify(monsters);
    wave.getState().submitDelta(delta);
}

function joinGame(){
    updatePlayer();
}

///// Main game update

var started = false;
function refreshGame(){
    map_json = wave.getState().get("map"); 
    if (map_json){
        var newmap = JSON.parse(map_json);
        if (newmap != map){
            map = newmap;
            loadMap();
            updateMap();
        }
    } else {
        loadMap();
        updateMap();
    }
    
    monsters_json = wave.getState().get("monsters");
    if (monsters_json){
        monsters = JSON.parse(monsters_json); 
    }
    
    if (!started){
        started = true;
        joinGame();
    }

    updatePlayerSprites();
    updateMonsters();
    slideMap();
}

function updatePlayerSprites(){
    var sprites_div = document.getElementById("sprites");
    for (player_id in getPlayers()){
        player_object = getPlayers()[player_id];
        var player_div = document.getElementById(player_id);
        if (!player_div){
            var new_player_div=document.createElement("div");
            new_player_div.id = player_id;
            new_player_div.setAttribute("class","human "+player_object.className);
            new_player_div.setAttribute("name",player_object.playerName);
            sprites_div.appendChild(new_player_div);
            player_div = new_player_div;
        }
        var x = player_object.x;
        var y = player_object.y;
        player_div.style.left = x*32+"px";
        player_div.style.top = y*32+"px";
    }
}
    
function getPlayers(){
    currentPlayers = {};
    for (var participant in wave.getParticipants()) {
        var player_id = wave.getParticipants()[participant].getId();
        var player_json = wave.getState().get(player_id);
        if (player_json){
            currentPlayers[player_id] = JSON.parse(player_json);
        }
    }
    return currentPlayers;
}


///// Players

function refreshPlayers(){
    // Update the player list and post a message about new players joining
    var list = "";
    players = getPlayers();
    for (player_id in players){
        var player = players[player_id];
        list = list + "<div class=\"human "+player.className+"\"></div><div class=\"player_info\">"+player.playerName+"</div>";
        if(!document.getElementById(wave.getParticipants()[participant].getId())){
          sendMessage("Oh look, here's "+player.playerName);
        }
    }
    var objDiv = document.getElementById("players");
    objDiv.innerHTML = list;
    objDiv.scrollTop = objDiv.scrollHeight;
    
    // Remove any players that have left the game
    var left = false;
    var sprites_divs = document.getElementById("sprites").getElementsByTagName('div');
    for (var x=0;x<sprites_divs.length;x++){
        var div = sprites_divs[x];
        if (div.getAttribute("class") && div.getAttribute("class").indexOf("human")!=-1){
            // See if the div is in the participants list, if not, remove them
            // TODO some kind of animation
            if (!wave.getParticipantById(div.id) && div.id != player.id){
                sendMessage(div.getAttribute("name")+" had an aneurysm");
                document.getElementById("sprites").removeChild(div);
                left=true;
            }
        }
    }
    
    // If any players have left, we need to update the map as it affects
    // the lighting
    if (left) updateMap();

    
}

function formatParticipant(icon, name){
    var iconElem = "<img class=\"icon\" src=\""+icon+"\">";
    var message = "<div class=\"post\">"+iconElem+"<span class=\"who\">"+name+"</span><br clear=\"both\"/></div>"
	return message;
}

///// Game messages
function sendMessage(message){
    document.getElementById("messages").innerHTML = message;
}

//// Info

function setInfo(message){
    document.getElementById("info").innerHTML = message;
}

function debug(message){
    document.getElementById("debug").innerHTML = document.getElementById("debug").innerHTML+"<p>"+message+"</p>";
}

