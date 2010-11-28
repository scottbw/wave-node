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
 
var map_size = 23;

var map_left_offset = 0;
var map_top_offset = 0;
var mapLayer = {};
var map = [];
map[0]=["wall","stairs_up","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall"];
map[1]=["wall","floor","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall"];
map[2]=["wall","floor","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall"];
map[3]=["wall","floor","floor","floor","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall"];
map[4]=["wall","floor","floor","floor","door","floor","floor","floor","floor","floor","floor","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall"];
map[5]=["wall","floor","floor","floor","wall","wall","wall","wall","wall","floor","floor","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall"];
map[6]=["wall","open_door","wall","wall","wall","wall","wall","wall","wall","floor","floor","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall"];
map[7]=["wall","floor","wall","wall","wall","lava","lava","lava","wall","floor","floor","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall"];
map[8]=["wall","floor","wall","wall","wall","lava","lava","lava","wall","floor","floor","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall"];
map[9]=["wall","floor","floor","floor","floor","lava","lava","lava","wall","floor","floor","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall"];
map[10]=["wall","floor","wall","wall","wall","wall","wall","wall","wall","wall","floor","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall"];
map[11]=["wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","door","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall"];
map[12]=["wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","floor","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall"];
map[13]=["wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","floor","floor","floor","floor","floor","floor","floor","floor","floor","floor","floor","floor","floor","wall"];
map[14]=["wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","floor","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall"];
map[15]=["wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","floor","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall"];
map[16]=["wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","floor","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall"];
map[17]=["wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","floor","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall"];
map[18]=["wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","floor","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall"];
map[19]=["wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","floor","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall"];
map[20]=["wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","floor","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall"];
map[21]=["wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","floor","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall"];
map[22]=["wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","floor","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall"];
map[23]=["wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","stairs_down","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall"];

function sendMapChanges(){
    wave.getState().submitValue("map", JSON.stringify(map));    
}

// Set up the map divs

function setupMapArea(){
    var objDiv = document.getElementById("map");
    objDiv.style.width = map_size*32+32+"px";
    objDiv.style.height = map_size*32+32+"px";
    var div = "";
    for(y=map_size;y>=0;y--){
        for(x=map_size;x>=0;x--){
            var tile_id = x+"_"+y;
            div = "<div id=\""+tile_id+"\" class=\"tile\"></div>" + div;
        }
    }    
    objDiv.innerHTML = div;
    var objDiv = document.getElementById("gamearea");
    objDiv.style.width = map_size*32+32+"px";
    objDiv.style.height = map_size*32+32+"px";
}

// Load the basic level map

function loadMap(){
    for(y=map_size;y>=0;y--){
        for(x=map_size;x>=0;x--){
            var tile_id = x+"_"+y;
            mapLayer[tile_id] = map[y][x];
        }
    }     
}


// Update the map tiles
function updateMap(){
    lightingMap = getLightingMap();
    for(y=map_size;y>=0;y--){
        for(x=map_size;x>=0;x--){
            var tile_id = x+"_"+y;
            // any nearby lit tiles?
            lighting = lightingMap[tile_id];
            if (!lighting) lighting = "";
            var objDiv = document.getElementById(tile_id);
            var tile = mapLayer[tile_id];
            objDiv.setAttribute("class", "tile "+tile+" "+lighting); 
        }
    }
}


// Dynamic lighting!

function getLightingMap(){
  var darkness_map = {};
  
  // The default is "darkest"
  for(y=map_size;y>=0;y--){
    for(x=map_size;x>=0;x--){
        var tile_id = x+"_"+y;
        darkness_map[tile_id]="darkest";
    }
  }
  
  players = getPlayers();

  // Everything within 4 squares of a player is "darker"
  for (player_id in players){
    player_object = players[player_id];
    darkness_map = applyEffect(darkness_map, player_object.x, player_object.y, 4, "darker");
  }
  
  // Everything within 3 squares of a player is "dark"
  for (player_id in players){
    player_object = players[player_id];
    darkness_map = applyEffect(darkness_map, player_object.x, player_object.y, 3, "dark");
  }
  
  // Everything within 2 squares of a player is "lit"
  for (player_id in players){
    player_object = players[player_id];
    darkness_map = applyEffect(darkness_map, player_object.x, player_object.y, 2, "lit");    
  }
  
  return darkness_map;

}


// Apply an effect to a layer
function applyEffect(layer, x, y, diameter, effect){
    for (yy=y+diameter;yy>=y-diameter;yy--){
        for(xx=x+diameter;xx>=x-diameter;xx--){
            if (!(
                (yy == y+diameter && xx == x+diameter) || 
                (yy == y-diameter && xx == x-diameter) ||
                (yy == y-diameter && xx == x+diameter) ||
                (yy == y+diameter && xx == x-diameter)
                )){
                var tile_id = xx+"_"+yy;
                layer[tile_id]=effect;        
            }    
        }
    }
    return layer;
}


function slideMap(){
    if (player.x > map_left_offset+5){
        slideMapLeft();
    } else {
        if (player.x < map_left_offset+5 && map_left_offset>0)
         slideMapRight();
    }
    if (player.y > map_top_offset+5){
        slideMapUp();
    } else {
        if (player.y < map_top_offset+5 && map_top_offset>0)
         slideMapDown();
    }
}


function slideMapLeft(){
        map_left_offset++;
        _slideMapLeft(0);
}
function _slideMapLeft(counter){
        var mapLayer = document.getElementById("gamearea");
        var left = mapLayer.style.left;
        if (!left) left = "0px";
        left = parseInt(left.split("px")[0]);
        mapLayer.style.left = left - 1 +"px";
        counter++;
        if (counter < 32) window.setTimeout("_slideMapLeft("+counter+")",10);
}
function slideMapRight(){
        map_left_offset--;
        _slideMapRight(0);
}
function _slideMapRight(counter){
        var mapLayer = document.getElementById("gamearea");
        var left = mapLayer.style.left;
        if (!left) left = "0px";
        left = parseInt(left.split("px")[0]);
        mapLayer.style.left = left + 1 +"px";
        counter++;
        if (counter < 32) window.setTimeout("_slideMapRight("+counter+")",10);
}
function slideMapUp(){
        map_top_offset++;
        _slideMapUp(0);
}
function _slideMapUp(counter){
        var mapLayer = document.getElementById("gamearea");
        var top = mapLayer.style.top;
        if (!top) top = "0px";
        top = parseInt(top.split("px")[0]);
        mapLayer.style.top = top - 1 +"px";
        counter++;
        if (counter < 32) window.setTimeout("_slideMapUp("+counter+")",10);
}
function slideMapDown(){
        map_top_offset--;
        _slideMapDown(0);
}
function _slideMapDown(counter){
        var mapLayer = document.getElementById("gamearea");
        var top = mapLayer.style.top;
        if (!top) top = "0px";
        top = parseInt(top.split("px")[0]);
        mapLayer.style.top = top + 1 +"px";
        counter++;
        if (counter < 32) window.setTimeout("_slideMapDown("+counter+")",10);
}