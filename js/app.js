/**
 * Red de Incendio - Interactive Fire Network Status App
 * Profertil - Estado de la Red de Incendio
 */
(function () {
    'use strict';

    const STORAGE_KEY = 'redincendio_state';
    let editMode = false;

    // ---- DOM references ----
    const btnToggleMode = document.getElementById('btn-toggle-mode');
    const modeDisplay = document.getElementById('mode-display');
    const modeIcon = document.getElementById('mode-icon');
    const btnSave = document.getElementById('btn-save');
    const btnReset = document.getElementById('btn-reset');
    const saveStatus = document.getElementById('save-status');
    const mapContainer = document.getElementById('map-container');
    const toastEl = document.getElementById('toast');

    const linesOkEl = document.getElementById('lines-ok');
    const linesOffEl = document.getElementById('lines-off');
    const valvesOkEl = document.getElementById('valves-ok');
    const valvesOffEl = document.getElementById('valves-off');

    // ---- Initialisation ----
    function init() {
        loadState();
        updateStats();
        bindEvents();
    }

    // ---- Event binding ----
    function bindEvents() {
        btnToggleMode.addEventListener('click', toggleEditMode);
        btnSave.addEventListener('click', saveState);
        btnReset.addEventListener('click', resetAll);

        // Delegate clicks on lines and valves
        document.getElementById('fire-lines').addEventListener('click', function (e) {
            if (!editMode) return;
            const line = e.target.closest('.fire-line');
            if (line) toggleElement(line);
        });

        document.getElementById('valves').addEventListener('click', function (e) {
            if (!editMode) return;
            const valve = e.target.closest('.valve');
            if (valve) toggleElement(valve);
        });
    }

    // ---- Edit mode ----
    function toggleEditMode() {
        editMode = !editMode;
        mapContainer.classList.toggle('edit-mode', editMode);
        btnToggleMode.classList.toggle('active', editMode);
        modeDisplay.textContent = editMode ? 'Edicion' : 'Vista';
        modeIcon.innerHTML = editMode ? '&#10004;' : '&#9998;';
        showToast(editMode ? 'Modo edicion activado: haga clic en lineas o valvulas' : 'Modo vista activado', 'info');
    }

    // ---- Toggle element status ----
    function toggleElement(el) {
        const current = el.getAttribute('data-status');
        const next = current === 'on' ? 'off' : 'on';
        el.setAttribute('data-status', next);
        updateStats();
    }

    // ---- Stats ----
    function updateStats() {
        const lines = document.querySelectorAll('.fire-line');
        const valves = document.querySelectorAll('.valve');

        let linesOn = 0, linesOff = 0, valvesOn = 0, valvesOff = 0;

        lines.forEach(function (l) {
            if (l.getAttribute('data-status') === 'on') linesOn++;
            else linesOff++;
        });

        valves.forEach(function (v) {
            if (v.getAttribute('data-status') === 'on') valvesOn++;
            else valvesOff++;
        });

        linesOkEl.textContent = linesOn;
        linesOffEl.textContent = linesOff;
        valvesOkEl.textContent = valvesOn;
        valvesOffEl.textContent = valvesOff;
    }

    // ---- Persistence ----
    function saveState() {
        const state = { lines: {}, valves: {} };

        document.querySelectorAll('.fire-line').forEach(function (l) {
            state.lines[l.id] = l.getAttribute('data-status');
        });

        document.querySelectorAll('.valve').forEach(function (v) {
            state.valves[v.id] = v.getAttribute('data-status');
        });

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            saveStatus.textContent = 'Guardado correctamente';
            showToast('Cambios guardados correctamente', 'success');
            setTimeout(function () { saveStatus.textContent = ''; }, 3000);
        } catch (err) {
            saveStatus.textContent = 'Error al guardar';
            showToast('Error al guardar los cambios', 'warning');
        }
    }

    function loadState() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;

            const state = JSON.parse(raw);

            if (state.lines) {
                Object.keys(state.lines).forEach(function (id) {
                    const el = document.getElementById(id);
                    if (el) el.setAttribute('data-status', state.lines[id]);
                });
            }

            if (state.valves) {
                Object.keys(state.valves).forEach(function (id) {
                    const el = document.getElementById(id);
                    if (el) el.setAttribute('data-status', state.valves[id]);
                });
            }
        } catch (err) {
            console.warn('No se pudo cargar el estado guardado:', err);
        }
    }

    function resetAll() {
        if (!confirm('¿Esta seguro de que desea resetear todo a "Fuera de Servicio"?')) return;

        document.querySelectorAll('.fire-line').forEach(function (l) {
            l.setAttribute('data-status', 'off');
        });

        document.querySelectorAll('.valve').forEach(function (v) {
            v.setAttribute('data-status', 'off');
        });

        updateStats();
        showToast('Todo reseteado a "Fuera de Servicio"', 'warning');
    }

    // ---- Toast ----
    function showToast(message, type) {
        toastEl.textContent = message;
        toastEl.className = 'toast ' + (type || 'info');
        setTimeout(function () {
            toastEl.classList.add('hidden');
        }, 2500);
    }

    // ---- Boot ----
    document.addEventListener('DOMContentLoaded', init);
})();
