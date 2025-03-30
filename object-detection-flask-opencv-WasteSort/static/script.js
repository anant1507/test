// ! Functions that deal with button events
$(function () {
  // * Preview switch
  $("a#cam-preview").bind("click", function () {
    $.getJSON("/request_preview_switch", function (data) {
      // do nothing
    });
    return false;
  });
});

$(function () {
  // * Flip horizontal switch
  $("a#flip-horizontal").bind("click", function () {
    $.getJSON("/request_flipH_switch", function (data) {
      // do nothing
    });
    return false;
  });
});

$(function () {
  // * Model switch
  $("a#use-model").bind("click", function () {
    $.getJSON("/request_model_switch", function (data) {
      // do nothing
    });
    return false;
  });
});

$(function () {
  // * exposure down
  $("a#exposure-down").bind("click", function () {
    $.getJSON("/request_exposure_down", function (data) {
      // do nothing
    });
    return false;
  });
});

$(function () {
  // * exposure up
  $("a#exposure-up").bind("click", function () {
    $.getJSON("/request_exposure_up", function (data) {
      // do nothing
    });
    return false;
  });
});

$(function () {
  // * contrast down
  $("a#contrast-down").bind("click", function () {
    $.getJSON("/request_contrast_down", function (data) {
      // do nothing
    });
    return false;
  });
});

$(function () {
  // * contrast up
  $("a#contrast-up").bind("click", function () {
    $.getJSON("/request_contrast_up", function (data) {
      // do nothing
    });
    return false;
  });
});

$(function () {
  // * reset camera
  $("a#reset-cam").bind("click", function () {
    $.getJSON("/reset_camera", function (data) {
      // do nothing
    });
    return false;
  });
});

// Track objects that have already triggered audio
let playedAudioObjects = [];

// Function to play Punjabi audio based on waste type
function playAudio(wasteType) {
    let audioFile;
    if (wasteType === "biodegradable") {
        audioFile = "static/audio/green_dustbin.mp3";
    } else if (wasteType === "non-biodegradable") {
        audioFile = "static/audio/blue_dustbin.mp3";
    } else if (wasteType === "chemical") {
        audioFile = "static/audio/black_dustbin.mp3";
    } else {
        return; // Unknown waste type
    }

    const audio = new Audio(audioFile);
    audio.play();
}

// Array to store all detected objects
let allDetectedObjects = [];

// Update detected objects list and play audio
function updateDetectedObjects(data) {
    const detectedObjectsDiv = document.getElementById("detected-objects");
    detectedObjectsDiv.innerHTML = "";

    console.log("Detected Objects:", data);  // Log detected objects for debugging

    // Add new detected objects to the list
    data.forEach(([object, wasteType]) => {
        // Check if the object has already been detected
        if (!allDetectedObjects.some(item => item.object === object && item.wasteType === wasteType)) {
            allDetectedObjects.unshift({ object, wasteType });  // Add to the beginning of the list
        }

        // Play audio announcement only if the object hasn't triggered audio recently
        if (!playedAudioObjects.includes(object)) {
            playAudio(wasteType);
            playedAudioObjects.push(object);  // Add the object to the tracking list
        }
    });

    // Clear the tracking list every 10 seconds to allow audio to play again
    setTimeout(() => {
        playedAudioObjects = [];
    }, 10000);  // 10 seconds

    // Display the latest detected object at the top
    if (allDetectedObjects.length > 0) {
        const latestObject = allDetectedObjects[0];
        const latestObjectDiv = document.createElement("div");
        latestObjectDiv.innerHTML = `<strong>Latest Detected Object:</strong> ${latestObject.object} (${latestObject.wasteType})`;
        detectedObjectsDiv.appendChild(latestObjectDiv);

        // Add a separator
        const separator = document.createElement("hr");
        detectedObjectsDiv.appendChild(separator);
    }

    // Display the list of all detected objects
    const listDiv = document.createElement("div");
    listDiv.innerHTML = "<strong>All Detected Objects:</strong>";
    detectedObjectsDiv.appendChild(listDiv);

    allDetectedObjects.forEach(({ object, wasteType }) => {
        const p = document.createElement("p");
        p.textContent = `${object} (${wasteType})`;
        detectedObjectsDiv.appendChild(p);
    });
}

// Fetch detected objects from the server
function fetchDetectedObjects() {
    fetch("/get_detected_objects")
        .then((response) => response.json())
        .then((data) => updateDetectedObjects(data));
}

// Poll the server for detected objects every 1 second
setInterval(fetchDetectedObjects, 1000);