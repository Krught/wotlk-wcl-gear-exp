const buttonId = "gear-sim-btn"; // Change the button ID

function init() {
  const url = window.location.href;

  addSimButton();

  if (!shouldShowButton(url)) {
    hideButton();
    return;
  } else {
    showButton();
  }

  // Add event listener for button click
  const simButton = document.getElementById(buttonId);
  simButton.addEventListener("click", handleButtonClick);


}

function showButton() {
  const button = document.getElementById(buttonId)

  if (button) {
    button.style.setProperty("display", "show", "important")
  }
}


function hideButton() {
  const button = document.getElementById(buttonId)

  if (button) {
    button.style.setProperty("display", "none", "important")
  }
}



function shouldShowButton(url) {
  return url.includes("fight=") && url.includes("source=") && url.includes("/reports/") && url.includes("summary") && !url.includes("timeline") && !url.includes("events");
}


function convertTimeToSeconds(timeString) {
  var cleanTimeString = timeString.replace(/\(|\)/g, ''); // Remove parentheses
  var timeParts = cleanTimeString.split(':');
  var minutes = parseInt(timeParts[0], 10);
  var seconds = parseInt(timeParts[1], 10);
  var totalSeconds = minutes * 60 + seconds;
  return totalSeconds;
}

function handleButtonClick() {
  var getgear_results = getgear();
  var current_sel_class = getgear_results.characterInfo;
  var gear_info = getgear_results.jsonData;
  var fightlen = current_sel_class.fightlength.innerHTML;
  var totalSeconds = convertTimeToSeconds(fightlen);
  //this is the number to set into the sim

  var lowered_class = current_sel_class.gameClass.toLowerCase();
  if (lowered_class === "priest") {
    lowered_class = "shadow_priest";
  } else if (lowered_class === "druid") {
    if (current_sel_class.talents.left < current_sel_class.talents.middle && current_sel_class.talents.middle > current_sel_class.talents.right) {
      lowered_class = "feral_druid";
    } 
    // if (current_sel_class.talents.left > current_sel_class.talents.middle && current_sel_class.talents.left > current_sel_class.talents.right) {
    //   lowered_class = "balance_druid";
    // } 
    else {
      lowered_class = "balance_druid";
    }
  } else if (lowered_class === "paladin") {
    if (current_sel_class.talents.right > current_sel_class.talents.middle && current_sel_class.talents.left < current_sel_class.talents.right) {
      lowered_class = "retribution_paladin";
    } else {
      lowered_class = "protection_paladin";
    }
  } else if (lowered_class === "shaman") {
    if (current_sel_class.talents.left > current_sel_class.talents.middle && current_sel_class.talents.left > current_sel_class.talents.right) {
      lowered_class = "elemental_shaman";
    } else {
      lowered_class = "enhancement_shaman";
    }
  }

  var dps = current_sel_class.dps;
  //characterInfo.gameClass
  const additionalVariable = {
    duration: totalSeconds,
    gear: gear_info,
    dps: dps
  }

  var class_link = 'https://wowsims.github.io/wotlk/' + lowered_class;
  chrome.runtime.sendMessage({ action: "openNewTab", url: class_link, additionalVariable: additionalVariable });




}

function addSimButton() {
  let button = document.getElementById(buttonId);

  if (button) {
    button.style.display = "block";
    return;
  }

  button = document.createElement("a");
  button.setAttribute("id", buttonId);
  button.className = "big-tab view-type-tab";

  const icon = document.createElement("span");
  // icon.className = "zmdi zmdi-eye";
  icon.className = "zmdi zmdi-eyedropper"; // Assuming "zmdi-flash" represents a sword icon in your icon library
  icon.style.color = "orange";

  const text = document.createElement("span");
  text.innerHTML = "<br> Sim Player & Fight"; // Change the button text
  text.className = "big-tab-text";
  text.style.color = "orange";

  const tabs = document.getElementById("top-level-view-tabs");
  button.appendChild(icon);
  button.appendChild(text);
  tabs.insertBefore(button, tabs.firstChild);
}


// Your function to be called when the URL changes
function WCLLoad() {
  if (window.location.href.startsWith("https://classic.warcraftlogs.com/")) {
    init();
  }
}

// Attach the function to the window's onpopstate event
window.onpopstate = WCLLoad;

// Call the function immediately to handle the initial URL
WCLLoad();


//Calculate WCL DPS
function calculateTotalDPS() {
  let totalDPS = 0;

  // Get all the table rows that contain data
  const rows = document.querySelectorAll("#summary-damage-done-0 tbody tr");

  // Loop through each row and extract the DPS value
  rows.forEach(row => {
    const dpsCell = row.querySelector(".main-table-number.primary");
    if (dpsCell) {
      const dpsValue = parseFloat(dpsCell.textContent.replace(/,/g, ""));
      if (!isNaN(dpsValue)) {
        totalDPS += dpsValue;
      }
    }
  });

  totalDPS = totalDPS.toFixed(2);

  return totalDPS;
}



// Function to extract character name and game class
function extractCharacterInfo() {
  const characterInfoSpan = document.querySelector("#filter-source-text span[class]");
  const gameClass = characterInfoSpan.classList[0];
  const name = characterInfoSpan.textContent.trim();

  const talentSpan = document.querySelector(".filter-bar.miniature .summary-right-caption span[class='estimate']");
  const talentValues = talentSpan.textContent.trim().split("/").map(value => value.trim());

  var fightDurationElement = document.querySelector('.fight-duration');



  const totalDPS = calculateTotalDPS();
  // alert(`Total DPS: ${totalDPS}`);


  return {
    name: name,
    gameClass: gameClass,
    talents: {
      left: parseInt(talentValues[0]),
      middle: parseInt(talentValues[1]),
      right: parseInt(talentValues[2]),
    },
    fightlength: fightDurationElement,
    dps: totalDPS
  };
}

// Function to extract gear and enchant gems
function extractGearAndGems() {
  const table = document.getElementById("summary-gear-0");
  const rows = table.querySelectorAll("tbody > tr");

  const gearData = [];

  rows.forEach((row) => {
    const ilvl = row.querySelector(".primary.rank").textContent.trim();
    const slot = row.querySelector(".num").textContent.trim();
    const itemName = row.querySelector(".main-table-name.report-table-name span").textContent.trim();
    
    const itemLink = row.querySelector(".main-table-name.report-table-name a").getAttribute("href");
    const itemId = parseInt(itemLink.match(/item=(\d+)/)[1]); // Convert to number using parseInt
    
    const relAttribute = row.querySelector(".main-table-name.report-table-name a").getAttribute("rel");
    const gemMatch = relAttribute.match(/gems=([^&]+)/);
    const gemIds = gemMatch ? gemMatch[1].split(":") : [];
    
    const enchantMatch = relAttribute.match(/ench=(\d+)/);
    const enchantId = enchantMatch ? parseInt(enchantMatch[1]) : null; // Convert to number using parseInt
    
    const enchantText = row.querySelector(".uncommon");
    const enchant = enchantText ? enchantText.textContent.trim() : "";

    gearData.push({
      name: itemName,
      id: itemId,
      enchant: {
        name: enchant,
        id: enchantId,
        itemId: null, // Replace with the actual item ID
        acquired: true // Replace with your logic for acquisition
      },
      gems: gemIds.map((gemId) => ({
        name: null, // Replace with the actual gem name
        id: parseInt(gemId), // Convert to number using parseInt
        acquired: true // Replace with your logic for gem acquisition
      })),
      acquired: true, // Replace with your logic for gear acquisition
      slot: slot
    });
  });

  return gearData;
}




// Copy JSON text to clipboard
function copyToClipboard(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}




function getgear(){
  // Prepare the data object
  const characterInfo = extractCharacterInfo();
  const jsonData = {
    name: characterInfo.name,
    phase: 3,
    links: {
      set: "https://eightyupgrades.com/set/fdmDYqD4QjsUQbZVYruuQp"
    },
    character: {
      name: characterInfo.name,
      level: 80,
      gameClass: characterInfo.gameClass,
      race: "DRAENEI",
      faction: "ALLIANCE"
    },
    items: extractGearAndGems(),
    // ... (other data)
  };

  // Convert the data to JSON string
  // const jsonText = JSON.stringify(jsonData, null, 2);

  // copyToClipboard(jsonText);


  return {characterInfo, jsonData};

}






//below this is the code that runs on the sim page
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "setData") {
    const additionalVariable = request.additionalVariable;
    
    // var durationInput = document.querySelector('.form-control.number-picker-input');
    var encounterPickerRoot = document.querySelector('.encounter-picker-root');
    var durationInput = encounterPickerRoot.querySelector('.form-control.number-picker-input');

    const gearText = JSON.stringify(additionalVariable.gear, null, 2);
    // console.log(gearText)
    
    
    var desiredDurationInSeconds = additionalVariable.duration; // Replace this with your desired duration in seconds

    // Set the value of the input field
    durationInput.value = desiredDurationInSeconds;

    // alert(additionalVariable.duration)

      // Find the "Import" link
    const importLink = document.querySelector(".import-export .import-link");
    
    //Click on the "Import" link to open the dropdown
    importLink.click();
    
    // Find the "80U" option and click on it
    const buttons = document.querySelectorAll(".import-export .dropdown-menu .dropdown-item[role='button']");
    for (const button of buttons) {
      if (button.innerText === '80U') {
        button.click();
        break; // Stop iterating once the button is clicked
      }
    }
    setTimeout(function () {
      // alert("Paste Your Clipboard Then Click Import")
      pastegear(gearText, additionalVariable);
    }, 2000); 

  }

function pastegear(gearText, additionalVariable){
  const textarea = document.querySelector(".importer-textarea.form-control");
  textarea.value = gearText;

  // const importButton = document.querySelector(".importer-button .btn .btn-primary .import-button");
  // importButton.click();
  const modalFooter = document.querySelector(".modal-footer");
  const importButton = modalFooter.querySelector(".import-button");

  importButton.click();


  setTimeout(function () {
    runsim(additionalVariable);
  }, 2500);

}

function wcldata(additionalVariable){
  // Create the new div element
  var totalDPS = additionalVariable.dps;
  const newDiv = document.createElement("div");
  newDiv.textContent = "WCL DPS: " + totalDPS;

  // Get the existing results-viewer element
  const resultsViewer = document.querySelector(".results-viewer");

  // Insert the new div above the results-pending element
  resultsViewer.insertBefore(newDiv, resultsViewer.firstChild);
}

function runsim(additionalVariable){
  wcldata(additionalVariable);
  // Select the container div
  const sidebarContent = document.querySelector(".sim-sidebar-content");

  if (sidebarContent) {
    // Select the number picker input
    const iterationsInput = sidebarContent.querySelector(".number-picker-input");

    // Select the simulate button
    const simulateButton = sidebarContent.querySelector(".dps-action");

    // Check if the necessary elements are found
    if (iterationsInput && simulateButton) {
      // Set the number of iterations (change this value as needed)
      iterationsInput.value = "5000";

      // Trigger a change event on the iterations input to simulate user input
      iterationsInput.dispatchEvent(new Event("change"));

      // Click the simulate button
      simulateButton.click();
    } else {
      // console.log("Could not find the required elements.");
    }
  } else {
    // console.log("Could not find the sidebar content container.");
  }

}


});