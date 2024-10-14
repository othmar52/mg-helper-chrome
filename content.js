window.onload = function() {
    console.log('window.onload triggered');
    showLoadingIndicator();  // Zeige visuelle Initialisierungsmeldung
    initModulargridHelper();
};

let mgHelperRackData = {};

// Funktion zum Anzeigen eines Ladeindikators
function showLoadingIndicator() {
    const body = document.querySelector('body');
    const loader = document.createElement('div');
    loader.id = 'mg-helper-loading';
    loader.style.position = 'fixed';
    loader.style.top = '10px';
    loader.style.right = '10px';
    loader.style.padding = '10px';
    loader.style.backgroundColor = 'yellow';
    loader.style.border = '1px solid black';
    loader.innerHTML = 'ModularGrid Helper is initializing...';
    body.appendChild(loader);
}

// Funktion zum Entfernen des Ladeindikators und Anzeigen einer Meldung
function showStatusMessage(success, message) {
    const loader = document.getElementById('mg-helper-loading');
    loader.style.backgroundColor = success ? 'green' : 'red';
    loader.innerHTML = message;
    setTimeout(() => {
        loader.remove();
    }, 3000);
}

function initModulargridHelper() {
    mgHelperRackData = getRackData();
    if (mgHelperRackData) {
        console.log(mgHelperRackData);
        extendMenu();
        hideRecaptcha();
        showStatusMessage(true, 'ModularGrid Helper successfully initialized.');
    } else {
        console.error('Failed to load rack data.');
        showStatusMessage(false, 'ModularGrid Helper failed to initialize.');
    }
}

function hideRecaptcha() {
    document.querySelectorAll('.grecaptcha-badge').forEach(function(el) {
        el.style.display = 'none';
    });
}


function extendMenu() {
    let interval = setInterval(function() {
        const menu = document.querySelector('#menu-edit');
        if (menu) {
            console.log('Menu found, modifying menu...');
            clearInterval(interval);

            // Entferne das alte "Swap Rows" Menü
            const oldSwapMenu = menu.querySelector('a[href="#"] i.icon-exchange');
            if (oldSwapMenu) {
                oldSwapMenu.closest('li').remove();
            }

            // Neues Menü erstellen
            const newMenuItem = createRowFunctionsMenu();
            menu.appendChild(newMenuItem);

        }
    }, 500);
}

function createRowFunctionsMenu() {
    const rackId = parseInt(mgHelperRackData.rack.Rack.id);
    const rows = parseInt(mgHelperRackData.rack.Rack.rows);

    const newItem = document.createElement('li');
    newItem.className = 'dropdown-submenu';
    newItem.innerHTML = '<a tabindex="-1" href="#"><i class="icon-exchange"></i> Row functions</a>';

    const subMenu = document.createElement('ul');
    subMenu.className = 'dropdown-menu';
    newItem.appendChild(subMenu);

    // Swap Rows Menü
    const swapRowsMenu = createSwapRowsSubmenu(rackId, rows);
    subMenu.appendChild(swapRowsMenu);

    // Move Rows Menü (nur Konsolen-Log für jetzt)
    const moveRowsMenu = createMoveRowsSubmenu(rows);
    subMenu.appendChild(moveRowsMenu);

    // Insert Empty Rows Menü (nur Konsolen-Log für jetzt)
    const insertEmptyRowsMenu = createInsertEmptyRowsSubmenu(rackId, rows);
    subMenu.appendChild(insertEmptyRowsMenu);

    // Remove Empty Rows Menü (nur Konsolen-Log für jetzt)
    const removeEmptyRowsMenu = createRemoveEmptyRowsSubmenu();
    subMenu.appendChild(removeEmptyRowsMenu);

    // Remove Modules from Rows Menü (aktive Funktion)
    const removeModulesFromRowMenu = createRemoveModulesFromRowSubmenu(rackId);
    subMenu.appendChild(removeModulesFromRowMenu);

    return newItem;
}

// Swap Rows Menü erstellen
function createSwapRowsSubmenu(rackId, rows) {
    const swapMenu = document.createElement('li');
    swapMenu.className = 'dropdown-submenu';
    swapMenu.innerHTML = '<a tabindex="-1" href="#">Swap Rows</a>';

    const submenu = document.createElement('ul');
    submenu.className = 'dropdown-menu';
    swapMenu.appendChild(submenu);

    for (let i = 1; i <= rows; i++) {
        const rowMenu = document.createElement('li');
        rowMenu.className = 'dropdown-submenu';
        rowMenu.innerHTML = `<a tabindex="${i}" href="#">Row ${i}</a>`;
        const rowSubmenu = document.createElement('ul');
        rowSubmenu.className = 'dropdown-menu';

        for (let j = 1; j <= rows; j++) {
            if (i !== j) {
                const swapLink = document.createElement('a');
                swapLink.href = `/e/modules_racks/swap_rows?rackId=${rackId}&from=${i}&to=${j}`;
                swapLink.textContent = `with Row ${j}`;
                const listItem = document.createElement('li');
                listItem.appendChild(swapLink);
                rowSubmenu.appendChild(listItem);
            }
        }
        rowMenu.appendChild(rowSubmenu);
        submenu.appendChild(rowMenu);
    }
    return swapMenu;
}
// Funktion zum Verschieben von Reihen durch mehrfaches Tauschen
function createMoveRowsSubmenu(rows) {
    const moveMenu = document.createElement('li');
    moveMenu.className = 'dropdown-submenu';
    moveMenu.innerHTML = '<a tabindex="-1" href="#">Move Rows</a>';
    const submenu = document.createElement('ul');
    submenu.className = 'dropdown-menu';
    moveMenu.appendChild(submenu);

    for (let i = 1; i <= rows; i++) {
        const rowMenu = document.createElement('li');
        rowMenu.className = 'dropdown-submenu';
        rowMenu.innerHTML = `<a tabindex="${i}" href="#">Row ${i}</a>`;
        const rowSubmenu = document.createElement('ul');
        rowSubmenu.className = 'dropdown-menu';

        // Dynamisch erstellte Links für andere Positionen (außer der aktuellen)
        for (let targetPosition = 1; targetPosition <= rows; targetPosition++) {
            if (targetPosition !== i) { // Keine Verschiebung auf die eigene Position
                const positionLink = document.createElement('a');
                positionLink.href = '#';
                positionLink.textContent = `to position ${targetPosition}`;
                positionLink.addEventListener('click', function() {
                    moveRow(i, targetPosition);
                });

                const listItem = document.createElement('li');
                listItem.appendChild(positionLink);
                rowSubmenu.appendChild(listItem);
            }
        }

        // Spezieller Link, um die Zeile ans Ende zu verschieben (wenn sie nicht schon dort ist)
        if (i !== rows) {
            const bottomLink = document.createElement('a');
            bottomLink.href = '#';
            bottomLink.textContent = `to bottom`;
            bottomLink.addEventListener('click', function() {
                moveRow(i, rows);
            });

            const listItemBottom = document.createElement('li');
            listItemBottom.appendChild(bottomLink);
            rowSubmenu.appendChild(listItemBottom);
        }

        rowMenu.appendChild(rowSubmenu);
        submenu.appendChild(rowMenu);
    }

    return moveMenu;
}

function showSwapStatus(message) {
    let statusElement = document.querySelector('#swap-status');

    if (!statusElement) {
        // Erstelle ein neues Status-Element, falls es noch nicht existiert
        statusElement = document.createElement('div');
        statusElement.id = 'swap-status';
        statusElement.style.position = 'fixed';
        statusElement.style.top = '10px';
        statusElement.style.right = '10px';
        statusElement.style.backgroundColor = '#000';
        statusElement.style.color = '#fff';
        statusElement.style.padding = '10px';
        statusElement.style.borderRadius = '5px';
        statusElement.style.zIndex = '10000'; // Stellt sicher, dass es oben liegt
        document.body.appendChild(statusElement);
    }

    statusElement.textContent = message; // Setzt die Status-Nachricht
}

function hideSwapStatus() {
    const statusElement = document.querySelector('#swap-status');
    if (statusElement) {
        statusElement.remove(); // Entfernt das Status-Element
    }
}



// Funktion zum Verschieben einer Reihe von Position 'from' zu 'to'
function moveRow(from, to) {
    console.log('moveRow');
    const rackId = mgHelperRackData.rack.Rack.id;

    // Wenn die aktuelle Position bereits der Zielposition entspricht, ist kein Swap nötig
    if (from === to) {
        console.log(`Row ${from} is already in position ${to}`);
        return;
    }

    const swaps = [];

    // Fall: Verschieben nach oben
    if (from > to) {
        for (let i = from; i > to; i--) {
            swaps.push({ from: i, to: i - 1 });
        }
    }

    // Fall: Verschieben nach unten
    if (from < to) {
        for (let i = from; i < to; i++) {
            swaps.push({ from: i, to: i + 1 });
        }
    }

    // Swap-Aufrufe ausführen
    executeSwaps(swaps, rackId);
}

function executeSwaps(swaps, rackId) {
    if (swaps.length === 0) {
        hideSwapStatus();
        location.reload();
        return;
    }

    const swap = swaps.shift();
    showSwapStatus(`Swapping Row ${swap.from} with Row ${swap.to}...`);

    const xhr = new XMLHttpRequest();
    xhr.open('GET', `/e/modules_racks/swap_rows?rackId=${rackId}&from=${swap.from}&to=${swap.to}`, true);

    xhr.onload = function() {
        if (xhr.status === 200) {
            console.log(`Swapped Row ${swap.from} with Row ${swap.to}`);
            setTimeout(() => {
                executeSwaps(swaps, rackId);
            }, 1000); // 1s warten
        } else {
            console.error('Error swapping rows:', xhr.status, xhr.statusText);
            hideSwapStatus();
        }
    };

    xhr.onerror = function() {
        console.error('Error swapping rows:', xhr.status, xhr.statusText);
        hideSwapStatus();
    };

    xhr.send();
}



function insertEmptyRow(rackId, currentRows, targetPosition = null) {
    showSwapStatus('Inserting empty row...');

    const formData = new FormData();
    formData.append('_method', 'PUT');
    formData.append('data[Rack][id]', rackId);
    formData.append('data[Rack][rows]', currentRows + 1); // Erhöhe die Anzahl der Reihen

    fetch(`/e/racks/edit/${rackId}`, {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (response.status === 200 || response.status === 302) {
            console.log('Empty row inserted. reloading rack');
            if (targetPosition && targetPosition !== currentRows + 1) {
                // Verzögerung, bevor die Swaps gestartet werden
                setTimeout(() => {
                    moveRow(currentRows + 1, targetPosition);
                }, 500); // Warte 500ms, bevor du die Swaps ausführst
            } else {
                location.reload(); // Neu laden, wenn keine Swaps nötig sind
            }
        } else {
            console.error('Error inserting empty row:', response);
            hideSwapStatus();
        }
    })
    .catch(error => {
        console.error('Error inserting empty row:', error);
        hideSwapStatus();
    });
}

function createInsertEmptyRowsSubmenu(rackId, rows) {
    const insertMenu = document.createElement('li');
    insertMenu.className = 'dropdown-submenu';
    insertMenu.innerHTML = '<a tabindex="-1" href="#">Insert empty row</a>';
    const submenu = document.createElement('ul');
    submenu.className = 'dropdown-menu';
    insertMenu.appendChild(submenu);

    // Option für das Einfügen ganz oben
    const topLink = document.createElement('a');
    topLink.href = '#';
    topLink.textContent = 'top';
    topLink.addEventListener('click', function() {
        insertEmptyRow(rackId, rows, 1);  // Insert at the top (position 1)
    });
    const topListItem = document.createElement('li');
    topListItem.appendChild(topLink);
    submenu.appendChild(topListItem);

    // Optionen für das Einfügen zwischen den Reihen
    for (let i = 1; i < rows; i++) {
        const betweenLink = document.createElement('a');
        betweenLink.href = '#';
        betweenLink.textContent = `between rows ${i} & ${i + 1}`;
        betweenLink.addEventListener('click', function() {
            insertEmptyRow(rackId, rows, i + 1);  // Insert between rows
        });
        const betweenListItem = document.createElement('li');
        betweenListItem.appendChild(betweenLink);
        submenu.appendChild(betweenListItem);
    }

    // Option für das Einfügen am Ende
    const bottomLink = document.createElement('a');
    bottomLink.href = '#';
    bottomLink.textContent = 'bottom';
    bottomLink.addEventListener('click', function() {
        insertEmptyRow(rackId, rows, rows + 1);  // Insert at the bottom (last position)
    });
    const bottomListItem = document.createElement('li');
    bottomListItem.appendChild(bottomLink);
    submenu.appendChild(bottomListItem);

    return insertMenu;
}

// Dummy-Funktion für Remove Empty Rows
function createRemoveEmptyRowsSubmenu() {
    const removeMenu = document.createElement('li');
    removeMenu.className = 'dropdown-submenu';
    removeMenu.innerHTML = '<a tabindex="-1" href="#">Remove empty rows</a>';
    const submenu = document.createElement('ul');
    submenu.className = 'dropdown-menu';
    removeMenu.appendChild(submenu);

    const removeAllLink = document.createElement('a');
    removeAllLink.href = '#';
    removeAllLink.textContent = 'all';
    removeAllLink.addEventListener('click', function() {
        console.log('Remove all empty rows');
    });

    const listItem = document.createElement('li');
    listItem.appendChild(removeAllLink);
    submenu.appendChild(listItem);

    return removeMenu;
}

// Funktion für Remove Modules from Row
function createRemoveModulesFromRowSubmenu(rackId) {
    const removeMenu = document.createElement('li');
    removeMenu.className = 'dropdown-submenu';
    removeMenu.innerHTML = '<a tabindex="-1" href="#">Remove modules from row</a>';
    const submenu = document.createElement('ul');
    submenu.className = 'dropdown-menu';
    removeMenu.appendChild(submenu);

    for (let row in mgHelperRackData.moduleMapObj) {
        const rowLink = document.createElement('a');
        rowLink.href = '#';
        rowLink.textContent = `modules of row ${row}`;
        rowLink.addEventListener('click', function() {
            removeModulesFromRow(row);
        });

        const listItem = document.createElement('li');
        listItem.appendChild(rowLink);
        submenu.appendChild(listItem);
    }
    return removeMenu;
}

function removeModulesFromRow(row) {
    const moduleIds = Object.values(mgHelperRackData.moduleMapObj[row]);

    moduleIds.forEach(moduleId => {
        fetch(`/e/modules_racks/delete.json?modules_rack_id=${moduleId}`, {
            method: 'GET'
        })
        .then(response => response.json())
        .then(data => {
            console.log(`Module ${moduleId} removed successfully.`);
            location.reload();
        })
        .catch(error => console.error('Error removing module:', error));
    });
}

function getRackData() {
    const scriptTag = document.querySelector('script[data-mg-json="rtd"]');

    if (scriptTag) {
        const jsonData = scriptTag.textContent;

        try {
            const dataObject = JSON.parse(jsonData);
            return dataObject;
        } catch (error) {
            console.error('unable to parse JSON:', error);
        }
    } else {
        console.error('unable to find script tag with data-mg-json="rtd"');
    }
    return null;
}
