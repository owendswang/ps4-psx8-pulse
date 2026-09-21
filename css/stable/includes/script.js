let timerId = null; 
var lastCacheProgress = 0;
const label = document.getElementById('autoJbLabel');
const checkbox = document.getElementById('autoJbInput');
const jeilbrekBtn = document.getElementById('jeilbrek');
const UAElement = document.getElementById("UA");

const storedAutoJb = localStorage.getItem("autoJb");
let autoJbValue = storedAutoJb !== null ? storedAutoJb === "true" : true;

// choose one of kernel exploits
var exploitChain = localStorage.getItem("exploitChain") || "lapse";
const netctrlRadio = document.getElementById("netctrl-exploit");
const lapseRadio = document.getElementById("lapse-exploit");
const kexForm = document.getElementById('kernel-options');

// Show user agent
UAElement.innerText += " " + navigator.userAgent;

kexForm.addEventListener("change", function (event) {
    localStorage.setItem("exploitChain", event.target.value);
    exploitChain = event.target.value;
});

// jailbreak execution
jeilbrekBtn.addEventListener("click", function (e){
    jeilbrekBtn.disabled = true;
    stopInterval();
    doJb();
});

// guarded reload button for recovering after a failed attempt
const reloadBtn = document.getElementById('reloadBtn');

if (reloadBtn) {
    reloadBtn.addEventListener("click", function () {
        stopInterval();
        window.location.reload();
    });
}

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

function jailbreakCountdown() {   
    stopInterval();

    let countdown = 5;
    label.textContent = `Auto Jailbreaking in: ${countdown}`;
    timerId = setInterval(() => {
        countdown--;
        label.textContent = `Auto Jailbreaking in: ${countdown}`;

        if (countdown < 0) {
            jeilbrekBtn.disabled = true; 
            clearInterval(timerId);
            timerId = null;
            label.textContent = 'Executing';
            doJb();
        }
    }, 1000);
}

// Auto-start entry point: run the countdown only on a settled cache.
// Starting the heavy exploit chain on top of an active AppCache download
// wedges the PS4 browser, so cover all AppCache states here:
// - CHECKING/DOWNLOADING: download in progress, wait for a terminal event;
// - UNCACHED with manifest: first visit, manifest check may not have started
//   yet, wait for it to begin + a terminal event, with a timeout fallback in
//   case AppCache is unavailable for this page (e.g. file://);
// - IDLE and others: cache is ready, countdown immediately but watch for a
//   late download (an update check may start after page load).
function startAutoJb() {
    if (jeilbrekBtn.disabled) return;
    var ac = window.applicationCache;
    var hasManifest = false;
    try { hasManifest = document.documentElement.hasAttribute("manifest"); } catch (e) { hasManifest = false; }
    if (!ac || !hasManifest) { jailbreakCountdown(); return; }

    var waitDone = false;
    var uncachedFallback = null;
    var progressWatchdog = null;
    var userTookOver = function () {
        return jeilbrekBtn.disabled || !checkbox.checked;
    };
    var stopProgressWatchdog = function () {
        if (progressWatchdog !== null) {
            clearInterval(progressWatchdog);
            progressWatchdog = null;
        }
    };
    // A stalled download fires no events at all: if AppCache reports an
    // active download but no progress arrives for a while, route it through
    // the same error/retry path instead of waiting forever.
    var startProgressWatchdog = function () {
        if (progressWatchdog !== null) return;
        lastCacheProgress = Date.now();
        progressWatchdog = setInterval(function () {
            if (waitDone || userTookOver()) { stopProgressWatchdog(); return; }
            var cur = ac.status;
            if (cur === ac.IDLE || cur === ac.UPDATEREADY) { onCacheReady(); return; }
            if ((cur === ac.DOWNLOADING || cur === ac.CHECKING) && (Date.now() - lastCacheProgress > 45000)) {
                onCacheError();
            }
        }, 5000);
    };
    var detachWaiters = function () {
        stopProgressWatchdog();
        ac.removeEventListener('downloading', onLateDownload, false);
        ac.removeEventListener('cached', onCacheReady, false);
        ac.removeEventListener('updateready', onCacheReady, false);
        ac.removeEventListener('noupdate', onCacheReady, false);
        ac.removeEventListener('error', onCacheError, false);
    };
    var onCacheReady = function () {
        if (waitDone) return;
        waitDone = true;
        detachWaiters();
        clearTimeout(uncachedFallback);
        try { sessionStorage.removeItem('cssCacheRetries'); } catch (e) {}
        if (!userTookOver()) jailbreakCountdown();
    };
    // Cache failures are usually transient (stalled connection), so retry
    // automatically with a per-session cap instead of giving up at once.
    // AutoJB + exploit choice survive the reload via localStorage.
    var MAX_CACHE_RETRIES = 3;
    var getCacheRetries = function () {
        try { return parseInt(sessionStorage.getItem('cssCacheRetries') || '0', 10) || 0; }
        catch (e) { return MAX_CACHE_RETRIES; }
    };
    var onCacheError = function () {
        if (waitDone) return;
        waitDone = true;
        detachWaiters();
        clearTimeout(uncachedFallback);
        var retries = getCacheRetries();
        if (retries < MAX_CACHE_RETRIES) {
            label.textContent = 'Cache error - retrying (' + (retries + 1) + '/' + MAX_CACHE_RETRIES + ')...';
            setTimeout(function () {
                try { sessionStorage.setItem('cssCacheRetries', String(retries + 1)); } catch (e) {}
                window.location.reload();
            }, 4000);
            return;
        }
        label.textContent = 'Cache error - press Jailbreak manually';
    };
    // A late download on a settled cache: stop the running countdown and
    // wait for a terminal event instead of racing the chain with it.
    var onLateDownload = function () {
        ac.removeEventListener('downloading', onLateDownload, false);
        if (waitDone || userTookOver()) return;
        stopInterval();
        label.textContent = 'Cache update found... auto-start paused';
        ac.addEventListener('cached', onCacheReady, false);
        ac.addEventListener('updateready', onCacheReady, false);
        ac.addEventListener('noupdate', onCacheReady, false);
        ac.addEventListener('error', onCacheError, false);
        startProgressWatchdog();
    };
    var st = ac.status;
    if (st === ac.CHECKING || st === ac.DOWNLOADING || st === ac.UNCACHED) {
        label.textContent = (st === ac.UNCACHED)
            ? 'Checking offline cache...'
            : 'Installing offline cache... auto-start paused';
        ac.addEventListener('cached', onCacheReady, false);
        ac.addEventListener('updateready', onCacheReady, false);
        ac.addEventListener('noupdate', onCacheReady, false);
        ac.addEventListener('error', onCacheError, false);
        startProgressWatchdog();
        if (st === ac.UNCACHED) {
            uncachedFallback = setTimeout(function () {
                if (waitDone) return;
                try {
                    // A download that started late is already covered by the
                    // terminal-event listeners above.
                    if (ac.status !== ac.UNCACHED) return;
                } catch (e) {}
                waitDone = true;
                detachWaiters();
                if (!userTookOver()) jailbreakCountdown();
            }, 8000);
        }
        return;
    }
    ac.addEventListener('downloading', onLateDownload, false);
    jailbreakCountdown();
}

function cacheProgress(e) {
    lastCacheProgress = Date.now();
    var Percent = (Math.round(e.loaded / e.total * 100));
    document.title = "Caching: " + Percent + "%";
}

function displayCacheProgress() {
    setTimeout(function () {
        // show a tick
        document.title = "\u2713";
    }, 1000);
    setTimeout(function () {
        // location.reload();
        document.title = "CSSFontFace exploit";
    }, 3000);
}

document.addEventListener("DOMContentLoaded", function() {
    // Cache handling
    if (window.applicationCache) {
        window.applicationCache.addEventListener("progress", cacheProgress, false);
        window.applicationCache.oncached = function (e) { displayCacheProgress(); };
        window.applicationCache.onupdateready = function (e) { displayCacheProgress(); };
    }

    // choose prefered exploit chain
    if (exploitChain == "netctrl") {
        netctrlRadio.checked = true;
    } else {
        lapseRadio.checked = true;
    }

    // apply autojb localStorage value
    checkbox.checked = autoJbValue;

    // Auto-start waits for a settled offline cache (see startAutoJb).
    if (autoJbValue) startAutoJb();
});