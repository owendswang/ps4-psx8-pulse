let timerId = null; 
const label = document.getElementById('autoJbLabel');
const checkbox = document.getElementById('autoJbInput');
const jeilbrekBtn = document.getElementById('jeilbrek');
const UAElement = document.getElementById("UA");

const storedAutoJb = localStorage.getItem("autoJb");
let autoJbValue = storedAutoJb !== null ? storedAutoJb === "true" : true;

// choose one of kernel exploits
var exploitChain = localStorage.getItem("exploitChain") || "lapse";
if (exploitChain !== "lapse" && exploitChain !== "netctrl") {
    exploitChain = "lapse";
    localStorage.setItem("exploitChain", exploitChain);
}
const netctrlRadio = document.getElementById("netctrl-exploit");
const lapseRadio = document.getElementById("lapse-exploit");
const kexForm = document.getElementById('kernel-options');
const cachePending = window.applicationCache && window.applicationCache.status === window.applicationCache.UNCACHED;
if (cachePending) {
    jeilbrekBtn.disabled = checkbox.disabled = netctrlRadio.disabled = lapseRadio.disabled = true;
}

// Show user agent
UAElement.innerText += " " + navigator.userAgent;

kexForm.addEventListener("change", function (event) {
    localStorage.setItem("exploitChain", event.target.value);
    exploitChain = event.target.value;
});

// jailbreak execution
jeilbrekBtn.addEventListener("click", function (e){
    executeJailbreak();
});

checkbox.addEventListener('change', function () {
    localStorage.setItem("autoJb", checkbox.checked);
    if (checkbox.checked == true && jeilbrekBtn.disabled == false) {
        startAutoJb();
        return;
    }

    stopInterval();
});

function stopInterval(){
    if (timerId !== null) {
        clearInterval(timerId);
        timerId = null;
    }
    label.textContent = "Auto Jailbreak";
}

function showExecutionError(error) {
    var message = error && error.message ? error.message : String(error || "unknown error");
    label.textContent = "Execution failed";
    jeilbrekBtn.disabled = false;
    var consoleElement = document.getElementById("console");
    if (consoleElement) {
        consoleElement.append("\n[-] Startup failed: " + message + "\n");
        consoleElement.scrollTop = consoleElement.scrollHeight;
    }
}

function executeJailbreak() {
    if (jeilbrekBtn.disabled) return;
    jeilbrekBtn.disabled = true;
    stopInterval();
    label.textContent = 'Executing';
    try {
        var result = doJb();
        if (result && typeof result.catch === "function") result.catch(showExecutionError);
    } catch (error) {
        showExecutionError(error);
    }
}

function jailbreakCountdown() {   
    stopInterval();

    let countdown = 5;
    label.textContent = `Auto Jailbreaking in: ${countdown}`;
    timerId = setInterval(() => {
        countdown--;
        label.textContent = `Auto Jailbreaking in: ${countdown}`;

        if (countdown < 0) {
            clearInterval(timerId);
            timerId = null;
            executeJailbreak();
        }
    }, 1000);
}

// index.html is an explicit AppCache entry rather than a manifest page. In
// WebKit it is still associated with the cache and starts an update check when
// parsed. Do not race the exploit against that CHECKING/DOWNLOADING window.
function startAutoJb() {
    if (jeilbrekBtn.disabled) return;

    var ac = window.applicationCache;
    if (!ac) {
        jailbreakCountdown();
        return;
    }

    var waiting = false;
    var removeLateListeners = function () {
        ac.removeEventListener("checking", onLateCacheActivity, false);
        ac.removeEventListener("downloading", onLateCacheActivity, false);
    };
    var removeTerminalListeners = function () {
        ac.removeEventListener("cached", onCacheReady, false);
        ac.removeEventListener("updateready", onCacheReady, false);
        ac.removeEventListener("noupdate", onCacheReady, false);
        ac.removeEventListener("error", onCacheError, false);
    };
    var onCacheReady = function () {
        if (!waiting) return;
        waiting = false;
        removeTerminalListeners();
        if (!jeilbrekBtn.disabled && checkbox.checked) jailbreakCountdown();
    };
    var onCacheError = function () {
        var status = ac.status;
        if (status === ac.IDLE || status === ac.UPDATEREADY) {
            onCacheReady();
            return;
        }
        waiting = false;
        removeTerminalListeners();
        label.textContent = "Cache unavailable";
    };
    var waitForCache = function () {
        if (waiting || jeilbrekBtn.disabled) return;
        waiting = true;
        removeLateListeners();
        stopInterval();
        label.textContent = "Checking offline cache...";
        ac.addEventListener("cached", onCacheReady, false);
        ac.addEventListener("updateready", onCacheReady, false);
        ac.addEventListener("noupdate", onCacheReady, false);
        ac.addEventListener("error", onCacheError, false);
    };
    function onLateCacheActivity() {
        if (!jeilbrekBtn.disabled && checkbox.checked) waitForCache();
    }

    var status = ac.status;
    if (status === ac.UNCACHED) return;
    if (status === ac.CHECKING || status === ac.DOWNLOADING) {
        waitForCache();
        return;
    }

    ac.addEventListener("checking", onLateCacheActivity, false);
    ac.addEventListener("downloading", onLateCacheActivity, false);

    // Close the race between reading status and installing the listeners.
    status = ac.status;
    if (status === ac.CHECKING || status === ac.DOWNLOADING) {
        waitForCache();
        return;
    }
    jailbreakCountdown();
}

document.addEventListener("DOMContentLoaded", function() {
    // Cache progress UI lives in cache.html; do not start while redirecting.
    if (cachePending) return;

    // choose prefered exploit chain
    if (exploitChain == "netctrl") {
        netctrlRadio.checked = true;
    } else {
        lapseRadio.checked = true;
    }

    // apply autojb localStorage value
    checkbox.checked = autoJbValue;

    if (autoJbValue) startAutoJb();
});