// Enhanced Input Validation
function validateInput(inputField, errorField, validator) {
    const value = inputField.value;
    const isValid = validator(value);
    if (!isValid) {
        inputField.classList.add("border-red-500");
        errorField.textContent = "Invalid input format.";
    } else {
        inputField.classList.remove("border-red-500");
        errorField.textContent = "";
    }
    return isValid;
}

// Input Validators
function isValidDistance(input) {
    return parseDistance(input) !== null;
}

function isValidTime(input) {
    return parseTimeToSeconds(input) !== null;
}

function isValidPace(input) {
    return parseTimeToSeconds(input) !== null;
}

function parseDistance(input) {
    input = input.trim().toLowerCase();
    let regex = /(\d+\.?\d*)\s*(km|k|m|meters|kilometers)?/;
    let match = input.match(regex);
    if (match) {
        let value = parseFloat(match[1]);
        let unit = match[2] || "km";
        if (unit === "km" || unit === "k" || unit === "kilometers") {
            return value;
        } else if (unit === "m" || unit === "meters") {
            return value / 1000;
        } else {
            return value; // Assume km if no unit
        }
    } else {
        return null;
    }
}

function parseTimeToSeconds(input) {
    input = input.trim().toLowerCase();
    let totalSeconds = 0;

    if (input.includes(":")) {
        // Handle colon-separated formats
        let parts = input.split(":").map(Number);
        if (parts.some(isNaN)) return null;
        if (parts.length === 3) {
            // hh:mm:ss
            totalSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
        } else if (parts.length === 2) {
            // mm:ss
            totalSeconds = parts[0] * 60 + parts[1];
        } else if (parts.length === 1) {
            // ss
            totalSeconds = parts[0];
        } else {
            return null;
        }
    } else {
        // Handle formats with units like '1h30m45s'
        let regex = /(?:(\d+\.?\d*)h)?\s*(?:(\d+\.?\d*)m)?\s*(?:(\d+\.?\d*)s)?/;
        let match = input.match(regex);
        if (match) {
            let hours = parseFloat(match[1]) || 0;
            let minutes = parseFloat(match[2]) || 0;
            let seconds = parseFloat(match[3]) || 0;
            totalSeconds = hours * 3600 + minutes * 60 + seconds;
        } else if (!isNaN(parseFloat(input))) {
            // Assume input is in seconds
            totalSeconds = parseFloat(input);
        } else {
            return null;
        }
    }
    return totalSeconds;
}

function formatSecondsToTime(seconds) {
    let h = Math.floor(seconds / 3600);
    let m = Math.floor((seconds % 3600) / 60);
    let s = Math.round(seconds % 60);
    let parts = [];
    if (h > 0) parts.push(h + "h");
    if (m > 0 || h > 0) parts.push(m + "m");
    parts.push(s + "s");
    return parts.join(" ");
}

function formatSecondsToPace(secondsPerKm) {
    let m = Math.floor(secondsPerKm / 60);
    let s = Math.round(secondsPerKm % 60);
    return `${m}:${s < 10 ? "0" + s : s} min/km`;
}

function calculate() {
    let distanceInput = document.getElementById("distance");
    let timeInput = document.getElementById("time");
    let paceInput = document.getElementById("pace");
    let result = document.getElementById("result");

    // Validate Inputs
    let distanceValid = !distanceInput.value || validateInput(distanceInput, document.getElementById("distance-error"), isValidDistance);
    let timeValid = !timeInput.value || validateInput(timeInput, document.getElementById("time-error"), isValidTime);
    let paceValid = !paceInput.value || validateInput(paceInput, document.getElementById("pace-error"), isValidPace);

    if (!distanceValid || !timeValid || !paceValid) {
        result.innerHTML = "Please correct invalid inputs.";
        return;
    }

    let distance = distanceInput.value ? parseDistance(distanceInput.value) : null;
    let timeInSeconds = timeInput.value ? parseTimeToSeconds(timeInput.value) : null;
    let paceInSeconds = paceInput.value ? parseTimeToSeconds(paceInput.value) : null;

    if ((distance !== null) + (timeInSeconds !== null) + (paceInSeconds !== null) !== 2) {
        result.innerHTML = "Please enter any <strong>two</strong> values to calculate the third.";
        return;
    }

    let calculatedValue = "";

    if (distance !== null && timeInSeconds !== null && paceInSeconds === null) {
        // Calculate pace
        let paceSeconds = timeInSeconds / distance;
        let paceFormatted = formatSecondsToPace(paceSeconds);
        result.innerHTML = `<strong>Pace:</strong> ${paceFormatted}`;
        calculatedValue = paceFormatted;
        updatePaceGauge(paceSeconds);
    } else if (distance !== null && paceInSeconds !== null && timeInSeconds === null) {
        // Calculate time
        let totalSeconds = paceInSeconds * distance;
        let timeFormatted = formatSecondsToTime(totalSeconds);
        result.innerHTML = `<strong>Time:</strong> ${timeFormatted}`;
        calculatedValue = timeFormatted;
        updatePaceGauge(paceInSeconds);
    } else if (timeInSeconds !== null && paceInSeconds !== null && distance === null) {
        // Calculate distance
        let calculatedDistance = timeInSeconds / paceInSeconds;
        result.innerHTML = `<strong>Distance:</strong> ${calculatedDistance.toFixed(2)} km`;
        calculatedValue = calculatedDistance.toFixed(2) + " km";
        updatePaceGauge(paceInSeconds);
    } else {
        result.innerHTML = "Please enter any <strong>two</strong> values to calculate the third.";
        return;
    }

    // Update URL without reloading the page
    let params = new URLSearchParams();
    if (distanceInput.value) params.append("distance", distanceInput.value);
    if (timeInput.value) params.append("time", timeInput.value);
    if (paceInput.value) params.append("pace", paceInput.value);
    let newURL = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({}, "", newURL);
}

// Set Distance from Shortcut Buttons
function setDistance(value) {
    document.getElementById("distance").value = value;
}

// Handle Enter Key to Perform Calculation
let inputs = document.querySelectorAll("#distance, #time, #pace");
inputs.forEach((input) => {
    input.addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            calculate();
        }
    });
});

// Clear Inputs Function
function clearInputs() {
    document.getElementById("distance").value = "";
    document.getElementById("time").value = "";
    document.getElementById("pace").value = "";
    document.getElementById("distance-error").textContent = "";
    document.getElementById("time-error").textContent = "";
    document.getElementById("pace-error").textContent = "";
    document.getElementById("result").innerHTML = "";
    document.getElementById("pace-gauge").innerHTML = "";
}

// Pace Gauge Function
function updatePaceGauge(paceInSecondsPerKm) {
    let paceGauge = document.getElementById("pace-gauge");
    // Example gauge: comparing pace to world record and average runner
    // World record pace for men marathon: ~2:02:00 => ~172.5 sec/km
    // Average jogging pace: ~6 min/km => 360 sec/km
    // Walking pace: ~10 min/km => 600 sec/km

    let minPace = 150; // faster than world record
    let maxPace = 600; // slow walking pace

    let percentage = ((paceInSecondsPerKm - minPace) / (maxPace - minPace)) * 100;
    percentage = Math.max(0, Math.min(100, percentage));

    let gaugeHTML = `
        <div class="w-full bg-gray-200 rounded-full h-4">
            <div class="bg-green-500 h-4 rounded-full" style="width: ${100 - percentage}%"></div>
        </div>
        <div class="flex justify-between text-sm mt-1">
            <span>Slower</span>
            <span>Faster</span>
        </div>
    `;
    paceGauge.innerHTML = gaugeHTML;
}

// Help and Documentation
function toggleHelp() {
    let helpContent = document.getElementById("help-content");
    helpContent.classList.toggle("hidden");
}

// Handle URL Parameters for Shareable Links
function handleURLParameters() {
    const params = new URLSearchParams(window.location.search);
    if (params.has("distance")) document.getElementById("distance").value = params.get("distance");
    if (params.has("time")) document.getElementById("time").value = params.get("time");
    if (params.has("pace")) document.getElementById("pace").value = params.get("pace");
    if (
        (params.has("distance") && params.has("time")) ||
        (params.has("distance") && params.has("pace")) ||
        (params.has("time") && params.has("pace"))
    ) {
        calculate();
    }
}

window.onload = function () {
    handleURLParameters();
};
