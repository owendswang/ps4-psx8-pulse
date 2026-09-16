let timerId = null; 
const label = document.getElementById('autoJbLabel');
const checkbox = document.getElementById('autoJbInput');
const jeilbrekBtn = document.getElementById('jeilbrek');
const UAElement = document.getElementById("UA");

const storedAutoJb = localStorage.getItem("autoJb");
// Автозапуск включён по умолчанию: хост сам начинает активацию GoldHEN
// через 5 секунд после загрузки. Выключение сохраняется в localStorage.
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

// upstream: guarded reload button for recovering after a failed attempt
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

// Гигиена лога консоли: за один прогон exploit пишет сотни отладочных строк,
// DOM #console растёт без ограничений. Держим последние строки, старые
// удаляем пачками. На логику чейна не влияет — только рендер; сам логгер
// в src/misc.js upstream-синхронен и не тронут.
var CONSOLE_KEEP_LINES = 400;
setInterval(function () {
    var c = document.getElementById('console');
    if (!c) return;
    while (c.childNodes.length > CONSOLE_KEEP_LINES + 100) {
        c.removeChild(c.firstChild);
    }
}, 5000);

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

// Точка входа автозапуска: если AppCache ещё качает файлы (первый визит),
// отсчёт НЕ стартует — ждём терминального события кэша (cached / updateready /
// noupdate / error). На повторных визитах кэш уже готов (IDLE) и идёт сразу
// обычный 5-секундный отсчёт.
function startAutoJb() {
    if (jeilbrekBtn.disabled) return;
    var ac = window.applicationCache;
    if (ac && (ac.status === ac.CHECKING || ac.status === ac.DOWNLOADING)) {
        label.textContent = 'Installing offline cache... auto-start paused';
        var releaseCacheWait = function (run) {
            ac.removeEventListener('cached', onReady, false);
            ac.removeEventListener('updateready', onReady, false);
            ac.removeEventListener('noupdate', onReady, false);
            ac.removeEventListener('error', onError, false);
            if (run) jailbreakCountdown();
        };
        var onReady = function () { releaseCacheWait(true); };
        var onError = function () {
            releaseCacheWait(false);
            label.textContent = 'Cache error - press Jailbreak manually';
        };
        ac.addEventListener('cached', onReady, false);
        ac.addEventListener('updateready', onReady, false);
        ac.addEventListener('noupdate', onReady, false);
        ac.addEventListener('error', onError, false);
        return;
    }
    jailbreakCountdown();
}

function cacheProgress(e) {
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

    // Автозапуск ждёт завершения установки AppCache: запуск тяжёлого
    // exploit-чейна (heap-spray, воркеры, kernel race) поверх фоновой
    // загрузки кэша вешает PS4-браузер — прогресс останавливается (~81%,
    // крупные файлы payload.bin и kernel-цепочки идут в конце очереди).
    if (autoJbValue) startAutoJb();
});
