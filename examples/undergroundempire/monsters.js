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
 
var monsters = null;

function spawnMonsters(){ 
    var spawn_monsters = [];
    spawn_monsters[0] = {};
    spawn_monsters[0].id = "monster1"; 
    spawn_monsters[0].name = "blue jelly"; 
    spawn_monsters[0].className = "blue_jelly"; 
    spawn_monsters[0].x = 1;   
    spawn_monsters[0].y = 5;
    spawn_monsters[0].health = 2;
    spawn_monsters[0].movement = 1;    
    spawn_monsters[0].awareness = 3;    
    
    spawn_monsters[1] = {};
    spawn_monsters[1].id = "monster2"; 
    spawn_monsters[1].name = "orange jelly"; 
    spawn_monsters[1].className = "orange_jelly"; 
    spawn_monsters[1].x = 1;   
    spawn_monsters[1].y = 6;  
    spawn_monsters[1].health = 2; 
    spawn_monsters[1].movement = 1; 
    spawn_monsters[1].awareness = 3;   
        
    return spawn_monsters;
}

function updateMonsters(){
    updateMonsterSprites();
    removeDeadMonsters();
}

function updateMonsterSprites(){    
    var sprites_div = document.getElementById("sprites");
    for (monster_idx in monsters){
        monster_object = monsters[monster_idx];
        var monster_div = document.getElementById(monster_object.id);
        if (!monster_div){
            var new_monster_div=document.createElement("div");
            new_monster_div.id = monster_object.id;
            new_monster_div.setAttribute("class","monster "+monster_object.className);
            sprites_div.appendChild(new_monster_div);
            monster_div = new_monster_div;
        }
        var x = monster_object.x;
        var y = monster_object.y;
        monster_div.style.left = x*32+"px";
        monster_div.style.top = y*32+"px";
    }
}

function removeDeadMonsters(){
   var sprites_divs = document.getElementById("sprites").getElementsByTagName('div');
    for (var x=0;x<sprites_divs.length;x++){
        var div = sprites_divs[x];
        if (div.getAttribute("class") && div.getAttribute("class").indexOf("monster")!=-1){
            // See if the div is in the monsters list, if not, remove them
            if (!findMonsterById(div.id)){
                document.getElementById("sprites").removeChild(div);
            }
        }
    }
}

function removeMonster(monster){
    for (monster_idx in monsters){
        monster_object = monsters[monster_idx];
        if (monster_object.id == monster.id){
            monsters.splice(monster_idx,1);
        }
    }
}

function findMonsterById(id){
    for (monster_idx in monsters){
        monster_object = monsters[monster_idx];
        if (monster_object.id == id) return true;
    }
    return false;
}

function containsMonster(x,y){
  for (monster_id in monsters){
    if(monsters[monster_id].x == x && monsters[monster_id].y == y) return true;
  }
  return null;
}

function monsterAt(x,y){
  for (monster_id in monsters){
    if(monsters[monster_id].x == x && monsters[monster_id].y == y) return monsters[monster_id];
  }
  return null;
}

function getTimerIncrement(){
    increment = 0;
    for(idx in wave.getParticipants()) increment+=1000;
    return increment;
}

function monsterLoop(){
    // Monster Moving
    // For each monster there is a "movement counter"
    // When it reaches its movement value, we move it and reset it to 5
    for (monster_id in monsters){
        monster = monsters[monster_id];
        if (!monster.moveCounter) monster.moveCounter = 6;
        monster.moveCounter = monster.moveCounter - random(2);
        if (monster.moveCounter<=monster.movement){
            moveMonster(monster);
            monster.moveCounter = 6;
        }
    }

    // Monster Spawning
    var spawn_counter = wave.getState().get("spawn_counter");
    if (!spawn_counter) spawn_counter = 0;
    spawn_counter++;
    if (spawn_counter >= 100){
        // Yay time to spawn monsters!
        debug("spawning more monsters");
        monsters = spawnMonsters();
        spawn_counter = 0;
    }
    
    // Send changes
    var delta = {};
    delta["spawn_counter"]=spawn_counter;
    delta["monsters"]=JSON.stringify(monsters);
    wave.getState().submitDelta(delta);   
    
    // Restart loop counter
    clearTimeout(timer);
    timer = setTimeout(monsterLoop, getTimerIncrement());
}

function moveMonster(monster){
    var target = getMoveForMonster(monster);
    if (containsPlayer(target[0],target[1])){
        var palyers = getPlayers();
        for (player_id in palyers){
            var player = (players[player_id]);
            if (player.x == target[0] && player.y == target[1]){
                monsterAttack(monster, player);
            }
        }
    } else {
        monster.x = target[0];
        monster.y = target[1];
    }
}

function monsterAttack(monster, player){
    sendMessage(monster.name+" attacks "+player.playerName);
}

function getMoveForMonster(monster){
    var grid = [];
    grid[0]=[0,0,0];
    grid[1]=[0,0,0];
    grid[2]=[0,0,0];
    
    for(var xx=0;xx<=2;xx++){
        for(var yy=0;yy<=2;yy++){
            // If a player is nearby, get him!
            if (containsPlayer(monster.x+(xx-1),monster.y+(yy-1))){
               grid[xx][yy] = 100;
            }
            // If it moves us towards a a player, that's good too
            var d = parseInt(monster.awareness);
            var left_limit = -d;
            var right_limit = d;
            var top_limit =  -d;
            var bottom_limit =  +d;
            for(var xxx=left_limit;xxx<=right_limit;xxx++){
                for(var yyy=top_limit;yyy<=bottom_limit;yyy++){
                    var looking_at_x = monster.x+(xx-1)+xxx;
                    var looking_at_y = monster.y+(yy-1)+yyy;
                    if (containsPlayer(looking_at_x,looking_at_y)){
                        var distance = Math.abs(xxx)+Math.abs(yyy);
                        var score = d-distance+1;
                        if (score < 0) score = 0;
                        grid[xx][yy] = grid[xx][yy] + score;
                    }
                }
            }
            
            // If its a possible move, thats OK
            if (monsterCanMoveTo(monster.x+xx-1,monster.y+yy-1)){
                grid[xx][yy] = grid[xx][yy] + 1;     
            } else {
                grid[xx][yy] = 0;               
            }
        }    
    }
    //var sgrid="<p>";
    //for(var yy=0;yy<=2;yy++){
    //    sgrid=sgrid+grid[0][yy]+" ";
    //    sgrid=sgrid+grid[1][yy]+" ";
    //    sgrid=sgrid+grid[2][yy];
    //    sgrid = sgrid + "<br>";
    //}
    //sgrid=sgrid+"</p>";
    //debug(sgrid);
    
    // Return the highest-value location in the grid
    var max = 1;
    var target = [monster.x,monster.y];
    
    for (var gx = 0; gx <= 2; gx++){
        for (var gy = 0; gy <= 2; gy++){
            if(grid[gx][gy] > max){
                target=[monster.x + (gx - 1),monster.y + (gy - 1)];
                max = grid[gx][gy];
            }
        }
    }
    return target;
}

function monsterCanMoveTo(x,y){
    var target = map[y][x];
    if (containsMonster(x,y)) return false;
    if (target == "floor"){
     return true;
    }
    if (target == "open_door"){
     return true;
    }
    return false;
}

var timer = setTimeout(monsterLoop, 2000);

function random(max){
    return Math.floor(Math.random()*max+1)
}