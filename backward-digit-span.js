// TEMPORARILY SET var bdsTotalTrials = 3; // SET TO 12 LATER

// NEEDS UPDATE IF TO BE UPLOADED TO GORILLA

var jsPsych = initJsPsych({
  show_progress_bar: true,
  auto_update_progress_bar: false
});

// Define Timeline
var timeline = [];

// Fullscreen mode
var fullscreen_trial = {
    type: jsPsychFullscreen,
    fullscreen_mode: true
  };

// Function to load sounds only if useAudio is set to true in bds_adaptive.js
function loadSounds(){
if(useAudio){
  return bds_sounds;
  } else {
  return null;
  }};

//Function to give the option for a local save of the data
var localSave;

function saveData() {
  if(localSave == 1) {
    var identifier = 'BDS_'+Math.round(new Date().getTime()/1000)+'.csv';
    jsPsych.data.get().localSave('csv',identifier);
    alert("You may now close this tab.");
  } else {
    alert("You may now close this tab.");
    }
  };

  /**********************************/
/** Main Variables and Functions **/
/**********************************/

var useAudio = false; // change to false if you want this to be a visual task!

var currentDigitList; //current digit list
var reversedDigitString; //reversed digit string
var totalCorrect = 0; //counter for total correct
var totalTrials = 0; //counter for total trials
var totalScore = 0; //counter for total trials
var maxSpan; //value that will reflect a participant's maximum span (e.g., 6)
var folder = "digits/"; //folder name for storing the audio files
var bdsTrialNum = 1; //counter for trials
var bdsTotalTrials = 3; //total number of desired trials
var response = []; //for storing partcipants' responses
var bds_correct_ans; //for storing the correct answer on a given trial
var staircaseChecker = []; //for assessing whether the span should move up/down/stay
var staircaseIndex = 0; //index for the current staircase
var digit_list = [1,2,3,4,5,6,7,8,9]; //digits to be used (unlikely you will want to change this)
var responseTimes = []; // Store all response times

var startingSpan = 3; //where we begin in terms of span
var currentSpan; //to reference where participants currently are
var spanHistory = []; //easy logging of the participant's trajectory
var stimList; //this is going to house the ordering of the stimuli for each trial
var idx = 0; //for indexing the current letter to be presented
var exitLetters; //for exiting the letter loop

const arrSum = arr => arr.reduce((a,b) => a + b, 0) //simple variable for calculating sum of an array
var aud_digits = ['one.mp3', 'two.mp3', 'three.mp3', 'four.mp3', 'five.mp3', 'six.mp3', 'seven.mp3', 'eight.mp3', 'nine.mp3']; //the digits

//add to the dataframe whether the BDS was auditory or visual
jsPsych.data.addProperties({
BDS_modality: (useAudio ? 'auditory' : 'visual')
});

//file map for use in the auditory implementation
var fileMap = {
1: "one.mp3",
2: "two.mp3",
3: "three.mp3",
4: "four.mp3",
5: "five.mp3",
6: "six.mp3",
7: "seven.mp3",
8: "eight.mp3",
9: "nine.mp3"
};

//function to push button responses to array
function recordClick(num) {
  response.push(num);
  document.getElementById("echoed_txt").innerHTML = response.join(", ");
  let button = document.querySelector(`.num-button:nth-child(${num})`);
  if (button) {
    button.style.opacity = "0.5"; // Reduce opacity
    button.style.pointerEvents = "none"; // Disable clicking again
  }
}

// Function to clear the response array
// accounted for undoing the opacity change in the keydown button presses
function clearResponse() {
  response = [];
  document.getElementById("echoed_txt").innerHTML = "";
  let buttons = document.querySelectorAll(".num-button");
  buttons.forEach(button => {
    button.style.opacity = "1";
    button.style.pointerEvents = "auto"; // Allow clicking again
  });
}

//function to map digit names to audio files (for auditory BDS)
var digitToFile = function (digit) {
    return folder + fileMap[digit];
  };


//function to shuffle an array (Fisher-Yates)
function shuffle(a) {
  var j, x, i;
  for (i = a.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1));
    x = a[i];
    a[i] = a[j];
    a[j] = x;
  }
  return a;
}

//function to get digit list for a trial
function getDigitList(len) {
  var shuff_final = [];
  //shuffle the digit list
  if(len <= digit_list.length) {
    shuff_final = shuffle(digit_list);
  } else {
    //this is overkill (generating too many digits) but it works and we slice it later anyway
    for (var j=0; j<len; j++){
      var interim_digits = shuffle(digit_list);
      shuff_final = [...shuff_final, ...interim_digits];
    }
  }
  var digitList = shuff_final.slice(0,len); //array to hold the final digits
  return digitList;
}

//function to push the stimuli to an array
function getStimuli(numDigits) {
  var digit;
  var stimList = [];
  currentDigitList = getDigitList(numDigits);
  reversedDigitString = "";
  for (var i = 0; i < currentDigitList.length; i += 1) {
    if (useAudio) {
      digit = currentDigitList[i];
      stimList.push(digitToFile(digit));
      reversedDigitString = digit.toString() + reversedDigitString;
    } else {
      digit = currentDigitList[i].toString();
      stimList.push('<p style="font-size:60px;font-weight:600;">' + digit + '</p>');
      reversedDigitString = digit + reversedDigitString;
    }
  }
  bds_correct_ans = currentDigitList.slice().reverse(); //this is the reversed array for assessing performance
  return stimList;
}

function calculateScore(responseTime) {
  let maxTime = 15000; // 15 seconds max
  let optimalTime = 2000; // Anything <= 2s gets full points

  if (responseTime <= optimalTime) {
    return 100; // Instant responses get full points
  }

  // Scale between 100 and 10 from 2s to 15s
  let score = 100 - ((responseTime - optimalTime) / (maxTime - optimalTime)) * 90;

  return Math.max(Math.round(score), 10); // Ensure minimum 10 points
}

//function to update the span as appropriate (using a 1:2 staircase procedure)
function updateSpan() {
  //if they got the last trial correct, increase the span.
  if (arrSum(staircaseChecker) == 1) {
    currentSpan += 1; //add to the span if last trial was correct
    staircaseChecker = []; //reset the staircase checker
    staircaseIndex = 0; //reset the staircase index
    totalCorrect += 1;
    //if they got the last two trials incorrect, decrease the span
  } else if (arrSum(staircaseChecker) == 0) {
    if(staircaseChecker.length == 2) {
      currentSpan -= 1; //lower the span if last two trials were incorrect
      if (currentSpan == 0) {
        currentSpan = 1; //make sure the experiment cannot break with exceptionally poor performance (floor of 1 digit)
      }
      staircaseChecker = []; //reset the staircase checker
      staircaseIndex = 0; //reset the staircase index
    }
  } else {
    return false;
  }
};


/******************/
/** Main Screens **/
/******************/

document.addEventListener("keydown", function(event) {
  if (event.key >= "1" && event.key <= "9") {
    response.push(Number(event.key));
    document.getElementById("echoed_txt").innerHTML = response.join(", ");
    let button = document.querySelector(`.num-button:nth-child(${event.key})`);
    if (button) {
      button.style.opacity = "0.5"; // Reduce opacity
      button.style.pointerEvents = "none"; // Disable clicking again
    }
  } else if (event.key === "Backspace" && response.length > 0) {
    let lastRemoved = response.pop(); // Get the last number removed
    document.getElementById("echoed_txt").innerHTML = response.join(", ");

    // Restore ONLY the last removed button
    let button = document.querySelector(`.num-button:nth-child(${lastRemoved})`);
    if (button) {
      button.style.opacity = "1";
      button.style.pointerEvents = "auto"; // Allow clicking again
      button.removeAttribute("data-used"); // Remove usage mark
    }
  }
});

window.onload = function () {
  // Create score display and add it to the page dynamically
  var scoreDisplay = document.createElement("div");
  scoreDisplay.id = "score-display";
  scoreDisplay.innerHTML = `Score: <span id="score-value">0</span>`;
  document.body.appendChild(scoreDisplay);
};



//From the Experiment Factory Repository
var response_grid = `
  <div class="response-container">
    <p class="instruction-text">What were the numbers <b style="color:red;">in REVERSE order</b>?<br>
      (Use the number keys or click the buttons.<br>Press ENTER to submit.)</p>

    <div class="numbox">
      <button class="num-button" onclick="recordClick(1)">1</button>
      <button class="num-button" onclick="recordClick(2)">2</button>
      <button class="num-button" onclick="recordClick(3)">3</button>
      <button class="num-button" onclick="recordClick(4)">4</button>
      <button class="num-button" onclick="recordClick(5)">5</button>
      <button class="num-button" onclick="recordClick(6)">6</button>
      <button class="num-button" onclick="recordClick(7)">7</button>
      <button class="num-button" onclick="recordClick(8)">8</button>
      <button class="num-button" onclick="recordClick(9)">9</button>
    </div>

    <button class="clear_button" onclick="clearResponse()">Clear</button>

    <h2><b>Current Answer:</b></h2>
    <div id="echoed_txt"></div>
  </div>
`;

//preload audio
var preload_digits = {
  type: jsPsychPreload,
  audio: aud_digits
};


//Dynamic instructions based on whether it is an auditory or visual task
var instructions;
if (useAudio) {
  instructions = '<p>On each trial, you will hear a sequence of digits and be asked to type them back in the <b style="color:red;">REVERSE</b> order in which they were heard.</p>'+
           '<p>For example, if you heard the digits <b style="color:#1976D2;">one</b>, <b style="color:#1976D2;">two</b>, '+
           '<b style="color:1976D2;">three</b>, you would respond with <b style="color:red;">3</b>, <b style="color:red;">2</b>, <b style="color:red;">1</b></p>';
} else {
  instructions = '<p>Again, on each trial, you will see a sequence of digits and be asked to type them back in the <b style="color:red;">REVERSE</b> order in which they were seen.</p>'+
           '<p>For example, if you saw the digits <b style="color:rgb(8, 123, 239);">1</b>, <b style="color:rgb(8, 123, 239);">2</b>, '+
           '<b style="color:rgb(8, 123, 239);">3</b>, you would respond with <b style="color:red;">3</b>, <b style="color:red;">2</b>, <b style="color:red;">1</b></p>';
}

var bds_welcome = {
type: jsPsychHtmlButtonResponse,
stimulus: '<p>Welcome to the real task.</b></p>' +instructions +
  '<p>To ensure high quality data, it is very important that you do not use any memory aid (e.g., pen and paper).<br>Please do the task solely in your head.</p>' +
  '<p>There will be '+bdsTotalTrials+' total trials.</p>',
choices: ['<span style="font-size:20px;">🚀 Start</span>']
};


//set-up screen
var setup_bds = {
  type: jsPsychHtmlButtonResponse,
  stimulus: function(){return '<h1>Trial '+bdsTrialNum+' of '+bdsTotalTrials+'</h1>';},
  choices: ['<span style="font-size:20px;">▶ Begin</span>'],
  post_trial_gap: 500,
  on_finish: function(){
    if(bdsTrialNum == 1) {
      currentSpan = startingSpan;
    }
    stimList = getStimuli(currentSpan); //get the current stimuli for the trial
    spanHistory[bdsTrialNum-1]=currentSpan; //log the current span in an array
    bdsTrialNum += 1; //add 1 to the total trial count
    idx = 0; //reset the index prior to the letter presentation
    exitLetters = 0; //reset the exit letter variable
  }
};

//letter presentation
var letter_bds = {
  type: jsPsychAudioKeyboardResponse,
  stimulus: function(){return stimList[idx];},
  choices: "NO_KEYS",
  post_trial_gap: 250,
  trial_ends_after_audio: true,
  on_finish: function(){
    idx += 1; //update the index
    //check to see if we are at the end of the letter array
    if (idx == stimList.length) {
      exitLetters = 1;
    } else  {
      exitLetters = 0;
    }
  }
};

//visual letter presentation
var letter_bds_vis = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: function(){return stimList[idx];},
  choices: "NO_KEYS",
  trial_duration: 500,
  post_trial_gap: 250,
  on_finish: function(){
    idx += 1; //update the index
    //check to see if we are at the end of the letter array
    if (idx == stimList.length) {
      exitLetters = 1;
    } else  {
      exitLetters = 0;
    }
  }
};

//conditional loop of letters for the length of stimList...different procedures for visual and audio
if(useAudio){
  var letter_proc = {
    timeline: [letter_bds],
    loop_function: function(){
      if(exitLetters == 0){
        return true;
      } else {
        return false;
      }
    }
  }
} else {
  var letter_proc = {
    timeline: [letter_bds_vis],
    loop_function: function(){
      if(exitLetters == 0){
        return true;
      } else {
        return false;
      }
    }
  }
};

function updateScore(newScore) {
  let scoreElement = document.getElementById("score-value");

  if (!scoreElement) {
    console.warn("Score display not found! Trying to create it again...");
    
    // Try to create the score display dynamically
    var scoreDisplay = document.createElement("div");
    scoreDisplay.id = "score-display";
    scoreDisplay.innerHTML = `Score: <span id="score-value">${newScore}</span>`;
    document.body.appendChild(scoreDisplay);
    
    // Reassign scoreElement after creating it
    scoreElement = document.getElementById("score-value");
  }

  let newScoreStr = newScore.toString().split("").map((digit, index) => 
    `<span class="bounce-letter" style="animation-delay: ${index * 0.1}s">${digit}</span>`
  ).join("");

  scoreElement.innerHTML = newScoreStr;

  // Apply scaling glow animation
  scoreElement.classList.remove("score-update-effect");
  void scoreElement.offsetWidth; // Forces reflow
  scoreElement.classList.add("score-update-effect");

  // Reset animation properly while keeping staggered effect
  setTimeout(() => {
    document.querySelectorAll(".bounce-letter").forEach((el, index) => {
      el.style.animation = "none"; // Reset animation
      void el.offsetWidth; // Force reflow
      el.style.animation = `bounceUpDown 1s ease-in-out 2 ${index * 0.1}s`; // Reapply with staggered delay
    });
  }, 10);  // Small delay to ensure reset
}


//response screen
var bds_response_screen = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: response_grid,
  choices: ['Enter'],
  on_start: function() {
    jsPsych.data.addProperties({ start_time: performance.now() });
    if (totalScore === 0) {
      let scoreElement = document.getElementById("score-value");

      if (!scoreElement) {
        console.warn("Score display not found! Trying to create it again...");
        
        // Try to create the score display dynamically
        var scoreDisplay = document.createElement("div");
        scoreDisplay.id = "score-display";
        scoreDisplay.innerHTML = `Score: <span id="score-value">${0}</span>`;
        document.body.appendChild(scoreDisplay);
        
        // Reassign scoreElement after creating it
        scoreElement = document.getElementById("score-value");
      }    
    }
  },
  on_finish: async function(data) { // Make this function async
    var end_time = performance.now();
    var start_time = jsPsych.data.get().last(1).values()[0].start_time;
    var responseTime = end_time - start_time;
    responseTimes.push(responseTime);
    console.log("Response Time Recorded:", responseTime, "ms");

    var score = calculateScore(responseTime);

    var curans = response;
    var corans = bds_correct_ans;
    var gotItRight = JSON.stringify(curans) === JSON.stringify(corans) ? 1 : 0;

    if (gotItRight) {
      totalScore += score; // Add score ONLY if correct
      updateScore(totalScore); // Update score display
      console.log("✅ Correct! Score updated.");
      staircaseChecker[staircaseIndex] = 1;

      // Submit score asynchronously
      await submitScore("Player", totalScore);
    } else {
      console.log("❌ Incorrect.");
      staircaseChecker[staircaseIndex] = 0;
    }

    response = []; // Clear response
    console.log("response cleared")
    staircaseIndex += 1; // Update staircase
    console.log(staircaseChecker);

    jsPsych.data.addDataToLastTrial({
      designation: 'BDS-RESPONSE',
      span: currentSpan,
      answer: curans,
      correct: corans,
      response_time: responseTime,
      was_correct: gotItRight,
      spanHistory: spanHistory
    });
  }
};

var smoothIncrement = function(targetProgress) {
  let currentProgress = jsPsych.getProgressBarCompleted();
  let step = 0.01; // Adjust the speed of increments
  
  function update() {
    if (currentProgress < targetProgress) {
      currentProgress += step;
      jsPsych.setProgressBar(currentProgress);
      setTimeout(update, 10); // Adjust interval for smoothness
    } else {
      jsPsych.setProgressBar(targetProgress);
    }
  }
  update();
};

var update_progress = {
  type: jsPsychCallFunction,
  func: function() {
    let progressValue = (bdsTrialNum - 1) / bdsTotalTrials;
    smoothIncrement(progressValue);
  }
};



/*********************/
/** Main Procedures **/
/*********************/

//call function to update the span if necessary
var staircase_assess = {
type: jsPsychCallFunction,
func: updateSpan
}

//the core procedure
var staircase = {
timeline: [setup_bds, letter_proc, bds_response_screen, update_progress, staircase_assess]
}

//main procedure
var bds_mainproc = {
  timeline: [staircase],
  loop_function: function(){
    //if we haev reached the specified total trial amount, exit
    if(bdsTrialNum > bdsTotalTrials) {
      return false;
    } else {
      return true;
    }
  }
};

/*************/
/** Wrap-Up **/
/*************/

var bds_wrapup = {
type: jsPsychHtmlButtonResponse,
stimulus: '<p>Thank you for your participation. This concludes the digit span.</p>',
choices: ['Continue']
};

/******/

var tutorial_intro = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <h2>Practice Round</h2>
    <p>Before starting, let's try a short practice round.</p>
    <p>You will see a sequence of numbers appear briefly. Your task is to type them back in <b style="color:red;">REVERSE</b> order.</p>
    <p>For example, if you see <b style="color:rgb(8, 123, 239);">1, 2, 3</b>, you should type <b style="color:red;">3, 2, 1</b>.</p>
    <p>Click "Begin" to start the practice.</p>`,
  choices: ['<span style="font-size:20px;">▶ Begin</span>'],
  on_finish: function() {
    response = []; // Ensure response is cleared before starting
    idx = 0; // Reset index so numbers display properly
  }
};

// **Preset tutorial sequence**
var tutorial_stimuli = ['1', '2', '3'];
var tutorial_correct_ans = [3, 2, 1];

// **Tutorial: Show numbers one by one**
var tutorial_presentation = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: function() {
    return `<p style="font-size:60px; font-weight:600;">${tutorial_stimuli[idx]}</p>`;
  },
  choices: "NO_KEYS",
  trial_duration: 500, // Show each number for 500ms
  post_trial_gap: 250, // Short gap between numbers
  on_finish: function() {
    idx += 1;
  }
};

// **Loop through tutorial digits (only once)**
var tutorial_sequence_loop = {
  timeline: [tutorial_presentation],
  loop_function: function() {
    return idx < tutorial_stimuli.length; // Stops when all numbers are shown
  }
};

// **Tutorial: Response screen**
var tutorial_response_screen = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: response_grid,
  choices: ['Enter'],
  data: { is_tutorial: true },
  on_start: function() {
    response = []; // Ensure response is cleared before input
  },
  on_finish: function(data) {
    var curans = response;
    var isCorrect = JSON.stringify(curans) === JSON.stringify(tutorial_correct_ans);
    jsPsych.data.addDataToLastTrial({ was_correct: isCorrect });

    // Clear response after checking correctness
    response = [];

    data.correct = isCorrect;
  }
};

// **Tutorial: Feedback screen (only shown once, no retries)**
var tutorial_feedback = {
  type: jsPsychHtmlButtonResponse,
  stimulus: function() {
    var last_trial = jsPsych.data.get().last(1).values()[0];
    if (last_trial.correct) {
      return `<p style="color:white; font-size:26px;">✅ Correct! Now let's move on to the real trials.</p>`;
    } else {
      return `<p style="color:white; font-size:26px;">❌ Incorrect! You should have typed: <b>${tutorial_correct_ans.join(", ")}</b>.</p>
              <p>That's okay! Let's move on to the real trials.</p>`;
    }
  },
  choices: ['Continue'],
  on_finish: function() {
    idx = 0; // Reset index when moving to main trials
    response = []; // Reset response for real task
  }
};

// **Final Tutorial Timeline (No Looping)**
var tutorial_sequence = {
  timeline: [tutorial_intro, tutorial_sequence_loop, tutorial_response_screen, tutorial_feedback]
};

var welcome_screen = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `
  <div class = "welcome-container">
      <h1 class = "fade-in slide-up" style="font-size: 36px; font-weight: bold;">🧠 Welcome to the Digit Span Task! 🔢</h1>
      <p class = "fade-in slide-up" style="font-size: 22px; max-width: 700px; margin: auto;">
        Your goal is to <b style="color: red";> memorize and recall </b> numbers in <b style="color: red";>reverse order</b>. 
        This test measures your working memory and attention.
      </p>
      <p class = "fade-in slide-up" style="font-size: 20px; color:rgb(0, 187, 6); font-weight: bold;">
        Press "Start" when you're ready!
      </p>
    </div>
  `,
  choices: ['Start'],
  button_html: '<button class="fade-in slide-up start-btn">%choice%</button>'
};


/******/

/////////////////////////
// 1. final procedure //
////////////////////////
/*
Simply push this to your timeline
variable in your main html files -
e.g., timeline.push(fds_adaptive)
*/

var bds_adaptive = {
  timeline: [preload_digits, 
    fullscreen_trial, 
    welcome_screen,
    tutorial_sequence, 
    bds_welcome, 
    bds_mainproc, 
    bds_wrapup]
};


timeline.push(bds_adaptive);

var results_screen = {
  type: jsPsychHtmlButtonResponse,
  stimulus: function() {
    let avgResponseTime = responseTimes.length > 0 
      ? (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(2) 
      : "N/A";
    // console.log("All Recorded Response Times in ms:", responseTimes);

    return `
      <h2>🎉 Task Complete! 🎉</h2>
      <div class="scoreboard">
          <p>✅ <span class="correct-score">Correct Answers:</span> ${totalCorrect} / ${bdsTotalTrials}</p>
          <p>🎯 <span class="correct-score">Accuracy:</span> ${(totalCorrect / bdsTotalTrials * 100).toFixed(2)}%</p>
          <p>⏳ <span class="time-score">Avg. Response Time:</span> <b>${(avgResponseTime / 1000).toFixed(2)} seconds</b></p>
          <p>🏆 <span class="final-score">Total Score:</span> ${totalScore}</p>
      </div>
      <p>📌 Did you know? Digit span tests help measure working memory capacity!</p>
      <p>📢 Share your results with friends!</p>
      <h3>🏆 Leaderboard</h3>
      <div id="leaderboard"></div>

      <h3>Enter Your Initials:</h3>
      <input type="text" id="player-initials" maxlength="3" placeholder="ABC" style="text-transform:uppercase;">
      <button id="submit-score">Submit Score</button>
      `;
  },
  choices: ['Share Results', 'Continue'],
  on_load: function() {
    fetchLeaderboard(); // Load leaderboard at the start

    let inputBox = document.getElementById("player-initials");
    inputBox.focus(); // Auto-focus on initials input

    document.getElementById("submit-score").addEventListener("click", function() {
      let initials = inputBox.value.toUpperCase().trim();
      if (/^[A-Z]{3}$/.test(initials)) {
        submitScore(initials);
      } else {
        alert("Please enter exactly 3 letters (A-Z).");
      }
    });
  },
  on_finish: function(data) {
    
    if (data.response === 0) {
      alert('Share functionality coming soon!');
    }
  }
};
timeline.push(results_screen);




//Final screen
var save_data = {
  type: jsPsychHtmlButtonResponse,
  stimulus: '<p>This concludes the task. Would you like to save the data?</p>',
  choices: ['No','Yes'],
  on_finish: function(data){
    var choice = data.response;
    if (choice === 1) {
      jsPsych.data.get().localSave('csv', 'backward-digit-span.csv');
      alert("Data has been saved successfully.");
    }
    else {
      alert("Data not saved.");
    }
    localSave = jsPsych.data.get().last(1).values()[0].response;
  }
};


//Push components to experiment timeline

timeline.push(save_data); //final screen asking about data

//Initialize the Experiment

function submitScore(initials) {
  let playerData = {
    name: initials,
    score: totalScore,
    country: Intl.DateTimeFormat().resolvedOptions().timeZone
  };

  fetch("/.netlify/functions/leaderboard", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(playerData)
  })
  .then(response => response.json())
  .then(data => {
    console.log("Leaderboard updated:", data);
    fetchLeaderboard(); // ✅ Update leaderboard immediately after submission
  })
  .catch(error => console.error("Error updating leaderboard:", error));
}


function fetchLeaderboard() {
  fetch("/.netlify/functions/leaderboard")
    .then(response => response.json())
    .then(data => {
      let leaderboardHTML = data.map((entry, index) => 
        `<p>🥇 ${index + 1}. ${entry.name} - ${entry.score} (${entry.country})</p>`
      ).join("");
      document.getElementById("leaderboard").innerHTML = leaderboardHTML;
    })
    .catch(error => console.error("Error fetching leaderboard:", error));
}



// async function loadLeaderboard() {
//   const response = await fetch("/.netlify/functions/leaderboard");
//   const leaderboard = await response.json();

//   let leaderboardHtml = "<ul style='list-style: none; padding: 0;'>";
//   leaderboard.forEach((entry, index) => {
//       leaderboardHtml += `<li style="font-size: 20px;">
//           🏅 ${index + 1}. <b>${entry.name}</b> - <span style="color: gold;">${entry.score}</span> (${entry.country})
//       </li>`;
//   });
//   leaderboardHtml += "</ul>";

//   document.getElementById("leaderboard").innerHTML = leaderboardHtml;
// }



jsPsych.run(timeline);