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
window.DEBUG = false;

// constant values
window.PUZZLE_KEY = 'PUZZLE';
window.SOLUTION_KEY = 'SOLUTION';
window.CELL_STATE_RE = /^cell_([0-9]+)$/;
window.PENALTY_STATE_RE = /^penalty_(.+)$/;

// sudoku generator object
window.generator = null;

// game data
window.gameReset = false;
window.waveReady = false;
window.puzzleArray = [];
window.solutionArray = [];
window.liveGameArray = [];
window.playerRecords = [];

// viewer data
window.viewerId = null;

// status messages on top
window.messages = [];
window.MAX_MESSAGES = 5;

function init() {
  window.generator = new sudoku.SudokuGenerator();

  if (window.DEBUG) {
    jQuery('#debugConsole').css({display: 'block'});
    initClickHandlers();    
  } else {
    jQuery('#debugConsole').css({display: 'none'});
  }

  if (window.wave) {

    wave.setParticipantCallback(function() {

      if (wave.getViewer() != null && window.viewerId == null) {
        window.viewerId = wave.getViewer().getDisplayName();
        // init the area heading
        updateMessages();
        updateRankingDisplay();
      }
      wave.setStateCallback(waveStateChanged);  
    });
        
  }
}

function appendMessage(msg) {
  if (messages.length >= MAX_MESSAGES) {
    messages.pop();    
  }
  messages.unshift(msg);

  updateMessages();
}

function updateMessages() {

  var html = [];
  html.push('<b>Updates:</b><br><br>');
  html.push(messages.join('<br>'));

  jQuery('#messages').html(html.join(''));
}

function debug(msg) {
  jQuery('#debug').prepend(msg + '<br/>');
}

function waveStateChanged() {
  if (!window.wave) {
    return;
  }  
  
  if (window.gameReset) {
    var keys = wave.getState().getKeys();
    var done = true;
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (window.CELL_STATE_RE.test(key) || 
          window.PENALTY_STATE_RE.test(key)) {
        done = false;
        break;
      }
    }    
    if (done) {
      window.gameReset = false;
      initGame();
      return;
    } else {
      return;
    }
  }

  if (!window.waveReady) {
    window.waveReady = true;
    initGame();
    return;
  }  

  updateGameProgress();  
}

function updateGameProgress() {
  var keys = wave.getState().getKeys();
  for (var i = 0; i < keys.length; ++i) {   
    var key = keys[i];
    
    if (key.match(window.CELL_STATE_RE)) {
      var arrayIndex = RegExp.$1;
      // only close this cell if it is still opened
      if (window.liveGameArray[arrayIndex] == 0) {
        var playerName = wave.getState().get(key);
        closeCell(arrayIndex, getCellValue(arrayIndex), playerName);
      }
    } else {
      if (key.match(window.PENALTY_STATE_RE)) {        
        var playerName = RegExp.$1;
        //playerName = playerName.replace(/\*/g, ' ');
        // handle the penalty count
        var penalty = wave.getState().get(key);        
        debug('penalty for ' + playerName + '=' + penalty);

        var playerRecord = getPlayerRecord(playerName);

        if (playerRecord == null) {
          playerRecord = newPlayerRecord(playerName);
        }

        if (playerRecord.penalty != penalty) {                
          playerRecord.penalty = penalty;
          var score = playerRecord.points - playerRecord.penalty;    
          updateRankingDisplay();  
          appendMessage(playerName + '<span style="color: red;"> -1</span>');
        }        
      }
    }
  }
}

function getPlayerRecord(playerName) {
  var ret = null;

  for (var i = 0; i < playerRecords.length; i++) {
    var record = playerRecords[i];
    if (record.name == playerName) {
      ret = record;
      break;
    }
  }

  return ret;
}

function newPlayerRecord(playerName) {
  playerRecord = {};
  playerRecord.name = playerName;
  playerRecord.points = 0;
  playerRecord.penalty = 0;
  playerRecords.push(playerRecord);
  return playerRecord;
}

function addPoint(playerName) {

  var playerRecord = getPlayerRecord(playerName);

  if (playerRecord == null) {
    playerRecord = newPlayerRecord(playerName);
  }  

  playerRecord.points++;

  updateRankingDisplay();
}

function updateRankingDisplay() {
  
  // sort player record by points
  playerRecords.sort(function(a, b) {
    return (b.points - b.penalty) - (a.points - a.penalty);
  });  

  var html = [];
  html.push('<b>Ranking:</b><br><br>');
  
  for (var i = 0; i < playerRecords.length; i++) {
    var playerRecord = playerRecords[i];
    var name = playerRecord.name;
    var total = playerRecord.points - playerRecord.penalty;
    var rank = i + 1;
    html.push('<b>' + rank + '. </b>');
    html.push(name + ' (' + total + ')');
    html.push('<br/>');
  }

  jQuery('#rankingDisplay').html(html.join(''));
}

function initClickHandlers() {
  
  jQuery('#clear').click(function() {
    jQuery('#debug').empty();
  });

  jQuery('#reset').click(function() {
    resetAllStates();
  });

  jQuery('#print').click(function() {
    printAllStates();
  });

}

function hasExistingGame() {
  var ret = false;

  if (get(PUZZLE_KEY) != null) {
    ret = true;
  }

  return ret;
}

function showGame() {
  displaySudoku(window.puzzleArray.join(''));
  updateGameProgress();
  jQuery('#loading').css('display', 'none');
}

function initGame() {
  debug('viewer id: ' + viewerId);
  
  if (hasExistingGame()) {
    debug("has existing game");
    // there is an existing game, read the data in
    window.puzzleArray = JSON.parse(get(PUZZLE_KEY));
    window.solutionArray = JSON.parse(get(SOLUTION_KEY));  
  } else {
    debug("generating new game");
    // you are the first player, you need to generate the game!
    var data = generateNewPuzzle();
    window.puzzleArray = data.puzzle;
    window.solutionArray = data.solution;
    set(PUZZLE_KEY, JSON.stringify(window.puzzleArray));
    set(SOLUTION_KEY, JSON.stringify(window.solutionArray));
  }

  window.liveGameArray = window.puzzleArray.concat([]); // clone liveGameArray from puzzleArray  

  showGame();
}

function generateNewPuzzle() {
  
  var data = {};
  
  try {
    var generator = new sudoku.SudokuGenerator();
    var puzzleString = generator.generate();

    data.puzzle = generator.partialArray;
    data.solution = generator.fullArray;

    if (puzzleString == null) {  
      data = generateNewPuzzle();
    }     
  } catch (e) {
    data = generateNewPuzzle();
  }

  return data;
}

function quitGame() {
  displayActualSolution();
}

function cleanup() {
  
  // - hide the sudoku display
  // - remove all previous event listeners on all cells
  // - remove all css class attr on all cells
  // - hide comment box if it is open
  // - hide timer & reset timer
  
  jQuery('#display').hide();
  
  for (var i=0;i<81;i++) {
    var cellId = '#cell_' + i;
    jQuery(cellId).unbind();
    jQuery(cellId).removeClass('blankCell');
    jQuery(cellId).removeClass('givenCell');
    jQuery(cellId).removeClass('solutionCell');  
  }
}

function isGameOver() { 

  if (liveGameArray.length == 0) {
    // the game isn't fully initialized yet
    return false;
  } else {
    return window.liveGameArray.join('') == window.solutionArray.join('');
  }
}

function onGameOver() { 

  if (confirm('Game over. New game?')) {
    // now reset the state callback function
    resetAllStates();
  }
}

function closeCell(arrayIndex, value, playerName) {
  var cell = jQuery('#cell_' + arrayIndex);
  cell.html(value);
  cell.addClass('solutionCell');  

  // make sure to unbind click handler
  cell.unbind('click');

  // update liveGameArray
  window.liveGameArray[arrayIndex] = value;

  addPoint(playerName);

  var playerRecord = getPlayerRecord(playerName);

  var score = playerRecord.points - playerRecord.penalty;
  appendMessage(playerName + '<span style="color: green;"> +1</span>');

  if (isGameOver()) {                
    // update game state to be over
    debug('game over');
    onGameOver();
  }
}

function onRightMove(arrayIndex, value) {  
  
  // update the local live game array
  window.liveGameArray[arrayIndex] = value;

  // report state change to save
  // TODO
  set('cell_' + arrayIndex, window.viewerId);

  closeCell(arrayIndex, value, window.viewerId);
}

function onWrongMove() {  
   
  var key = 'penalty_' + window.viewerId; //.replace(/ /g, '*');

  var value = get(key);

  if (value == null) {
    value = 0
  }
  value++;
  set(key, value);  
}

function blurOnCell(inputBox) {
  var userInput = parseInt(inputBox.val());//inputBox.attr('value');
  var cell = inputBox.parent();
 
  var cellId = cell.attr('id');
  var arrayIndex = parseInt(cellId.replace('cell_', ''));     

  if (isInputCorrect(arrayIndex, userInput)) { 
    onRightMove(arrayIndex, userInput);
  } else {     
    onWrongMove();
    cell.empty();
    cell.bind('click', handleCellInput);  
  }
  
  //checkGame();
}

function getCellValue(arrayIndex) {
  return window.solutionArray[arrayIndex];
}

function isInputCorrect(arrayIndex, input) {
  return (getCellValue(arrayIndex) == input);
}

function handleCellInput() {
        
  var arrayIndex = parseInt(jQuery(this).attr('id').replace('cell_', ''));  
  
  debug('ans: ' + getCellValue(arrayIndex));

  jQuery(this).unbind('click');
         
  //clearAnnounce();      
        
  var cell = jQuery(this);
        
  var cellValue = (cell.html() == '')?'':'value=' +cell.html();    

  var inputBox = jQuery('<input maxlength=1 ' + cellValue 
    + ' type=text id=cellOpenBox>');
        
  cell.html(inputBox);
        
  inputBox.focus();
  inputBox.select();
          
  inputBox.blur(function () {
    var number = parseInt(inputBox.val());
    debug('user ans=' + number);
     if (isNaN(number)) {
       cell.empty();
       cell.bind('click', handleCellInput); 
     } else {
       if (number >= 1 && number <= 9) {
         inputBox.unbind();
         blurOnCell(inputBox);
       }
     }
  });
  
  inputBox.keyup(function() {
    var number = parseInt(inputBox.val());
    debug('user ans=' + number);
     if (isNaN(number)) {
       cell.empty();
       cell.bind('click', handleCellInput); 
     } else {
       if (number >= 1 && number <= 9) {
         inputBox.unbind();
         blurOnCell(inputBox);
       }
     }
  });          
}

function displaySudoku(sudokuStr) {
  
  cleanup();
  
  for (var i=0;i<sudokuStr.length;i++) {
    var value = sudokuStr.charAt(i);
    
    var cellId = '#cell_' + i;
    
    if (value == 0) {
      // this is a blank cell      
      jQuery(cellId).click(handleCellInput);            
      jQuery(cellId).html('');  
      
    } else {  
      // this is a given cell
      jQuery(cellId).html(value);  
    }
  }
  jQuery('#display').fadeIn(500);
  jQuery('#quit').show();
}

function get(key) {
  var ret = null;
  if (window.wave) {
    ret = wave.getState().get(key); 
  }
  return ret;
}

function set(key, value) {
  var obj = {};
  obj[key] = value;
  if (window.wave) {
    wave.getState().submitDelta(obj);
  }  
}

function rm(key) {
  var obj = {};
  obj[key] = null;  
  if (window.wave) {
    wave.getState().submitDelta(obj);
  }  
}

function getViewerId() {
  var ret = null;

  if (window.wave) {

    ret = wave.getViewer().getDisplayName();
  }

  return ret;
}

function printAllStates() {  

  if (!window.wave) {
    return;
  }

  var html = [];

  var keys = wave.getState().getKeys();

  for (var i = 0; i < keys.length; ++i) {   
    var key = keys[i];
    var value = wave.getState().get(key);

    html.push(key + ' = ' + value);
    html.push('<br>');
  }
  
  debug(html.join(''));
}

function resetAllStates() {

  if (window.wave) {

    var obj = {};

    // reset all game data
    window.puzzleArray = [];
    window.solutionArray = [];
    window.liveGameArray = [];
    window.playerRecords = [];
    window.messages = [];
    window.gameReset = true;

    obj[window.PUZZLE_KEY] = null;
    obj[window.SOLUTION_KEY] = null;
    
    var keys = wave.getState().getKeys();

    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (window.CELL_STATE_RE.test(key) || 
          window.PENALTY_STATE_RE.test(key)) {
        obj[key] = null;
      }
    }
   
    debug(JSON.stringify(obj));

    wave.getState().submitDelta(obj);

    // clear info
    updateMessages();
    updateRankingDisplay();
  }    

}
