//imports de bibliotecas
const blessed = require('blessed');
const fs = require('fs');
const path = require('path');
const savedConfigsDir = './saved_configs/'; 

//confirmar que existe e nao esta vazio 
try {
    if (!fs.existsSync(savedConfigsDir)) {
        fs.mkdirSync(savedConfigsDir, { recursive: true });
    }
} catch (err) {
    console.error("Fatal Error: Could not create saved configurations directory:", err);
    console.error("Please check permissions and try again.");
    process.exit(1);
}

// Defaults iniciais 
const initialSelectedOptions = {
    serialCom: '/dev/ttyACM0', 
    startAddress: '0', 
    address: '',
    function: '03-Read Holding Registers', 
    baudRate: '9600',
    architecture: 'Little Endian', 
    signal: 'Unsigned', 
    type: 'Int',
    parity: 'None', 
    stopBits: '2', 
    dataBits: '8', 
    description: '',
    filename: null
};

let selectedOptions = { ...initialSelectedOptions };

//ecrâ
const screen = blessed.screen({
    smartCSR: true, 
    title: 'Options Menu', 
    fullUnicode: true, 
    autoPadding: true //ajusta o alimentação automaticamente
});

const menuBox = blessed.box({
    parent: screen, 
    top: 'center', 
    left: '5%', 
    width: '30%', 
    height: '80%',
    border: 'line', 
    label: ' Main Menu ', 
    style: { 
        border: { fg: 'white' }
     }
});

const contentBox = blessed.box({
    parent: screen, 
    top: 'center', 
    left: '40%', 
    width: '55%', 
    height: '80%',
    border: 'line', 
    label: ' Details ', 
    hidden: true, 
    style: { 
        border: { fg: 'cyan' }
     }
});

//LEGENDA
const legendBox = blessed.box({
    parent: screen, 
    bottom: 0, 
    left: 'center', 
    width: '55%', 
    height: 'shrink',
    align: 'center', 
    content: '←/ ↑ /↓ /→ : Navigate | Enter: Select/Confirm | Esc: Back/Exit ',
    style: { fg: 'white', bg: 'magenta' }
});
screen.append(legendBox);
screen.render();

//Opções de configuração

const serialComOptions = ['/dev/ttyACM0', '/dev/ttyAMA0', '/dev/ttySC0', '/dev/ttyUSB0'];
const startAddressOptions = ['0', '1'];
const functionOptions = ['01-Read Coils', '02-Read Discrete Inputs', '03-Read Holding Registers', '04-Read Input Registers', '05-Write Single Coil', '06-Write Single Register', '07-Write Multiple Coils', '08-Write Multiple Registers'];
const baudRateOptions = ['300', '600', '1200', '2400', '4800', '9600', '19200', '38400', '57600', '115200'];
const architectureOptions = ['Little Endian', 'Big Endian'];
const signalOptions = ['Signed', 'Unsigned'];
const typeOptions = ['Int', 'Float'];
const parityOptions = ['Even', 'Odd', 'None'];
const stopBitsOptions = ['1', '2'];
const dataBitsOptions = ['1', '2', '3', '4', '5', '6', '7', '8'];

// MENUS
//menu principal
const mainMenu = blessed.list({
    parent: menuBox, 
    top: 1, 
    left: 1, 
    width: '90%', 
    height: '90%',
    keys: true, 
    mouse: true, 
    interactive: true,
    items: [' 1-Create >>', ' 2-Load >>', ' 3-Exit'],
    style: { selected: { bg: 'blue', fg: 'white' } }
});

//menu load
const loadMenu = blessed.list({
    parent: contentBox,
    top: 0, 
    left: 0, 
    width: '90%', 
    height: '90%',
    keys: true, 
    mouse: true, 
    interactive: true, 
    hidden: true,
    items: ['<< Back'], 
    style: {
        selected: { bg: 'blue', fg: 'white' },
        item: { fg: 'white', height: 1 }
    }
});

const createMenu = blessed.list({
    parent: contentBox,
    top: 0, 
    left: 0, 
    width: '90%', 
    height: '90%', 
    keys: true, 
    mouse: true, 
    interactive: true, 
    hidden: true,
    tags: true,
    items: [' RTU', ' TCP (para implementar)', ' << Back'],
    style: {
        selected: { bg: 'blue', fg: 'white' },
    }
});

//RTU
const rtuMenu = blessed.list({ 
    parent: contentBox, 
    top: 1, 
    left: 1, 
    width: '90%', 
    height: '90%',
    keys: true, 
    mouse: true, 
    interactive: true, 
    hidden: true, 
    parseTags: true,  
    style: { selected: { bg: 'blue', fg: 'white' } }
});

// Caixas texto
const commonTextboxOptions = {
    parent: screen, 
    top: 'center', 
    left: 'center', 
    width: '50%', 
    height: 'shrink', 
    border: 'line', 
    hidden: true, 
    inputOnFocus: true, 
    keys: true, 
    mouse: true,
    style: { border: { fg: 'white' }, focus: { border: { fg: 'yellow' } } }
};

const addressBox = blessed.textbox({
    ...commonTextboxOptions,
    height: '20%', 
    label: 'Address (Numbers Only) ' });

const descriptionBox = blessed.textbox({ 
    ...commonTextboxOptions, 
    height: '30%', 
    label: 'Description' });

const saveAsBox = blessed.textbox({ 
    ...commonTextboxOptions, 
    height: '20%', 
    width: '70%', 
    label: ' Save As ( .json auto) ', 
    style: { ...commonTextboxOptions.style, border: { fg: 'green' } } });

const searchBox = blessed.textbox({ 
    ...commonTextboxOptions, 
    height: '20%', 
    top: '15%', 
    label: ' Search Filename', 
    style: { ...commonTextboxOptions.style, border: { fg: 'cyan' } } });

const messageBox = blessed.box({
    parent: screen, 
    top: 'center', 
    left: 'center', 
    width: '60%', 
    height: '25%',
    border: 'line', 
    hidden: true, 
    tags: true, 
    content: '', 
    label: ' Message ',
    style: { border: { fg: 'green' }, fg: 'white' }
});

const errorBox = blessed.box({
    parent: screen, 
    top: 'center', 
    left: 'center', 
    width: '60%', 
    height: '25%',
    border: 'line', 
    hidden: true, 
    tags: true, 
    content: '', 
    label: 'Error',
    style: { border: { fg: 'red' }, fg: 'red' }
});

const filterMenu = blessed.list({
    parent: screen, 
    top: 'center', 
    left: 'center', 
    width: '50%', 
    height: '60%',
    keys: true, 
    mouse: true, 
    interactive: true, 
    hidden: true,
    border: 'line', 
    label: ' Filter By ', 
    tags: true,
    items: [ ' All Files', ' By Baud Rate', ' By Function', ' << Back' ],
    style: { selected: { bg: 'blue', fg: 'white' }, border: { fg: 'white' }, item: { fg: 'white', height: 1 } }
});

//funções
function getVisibleContentMenu() {
    if (createMenu.visible && !createMenu.hidden) 
        return createMenu;
    if (loadMenu.visible && !loadMenu.hidden) 
        return loadMenu;
    if (rtuMenu.visible && !rtuMenu.hidden) 
        return rtuMenu;
    return null;
}

function focusDefaultElement() {
    const visibleContentMenu = getVisibleContentMenu();
    if (visibleContentMenu) {
        visibleContentMenu.focus();
    } else if (mainMenu.visible && !mainMenu.hidden) {
        mainMenu.focus();
    } else {
        screen.render(); // Fallback render
    }
}

// Avisos, mensagens de erros...
function showTemporaryMessage(title, text, style = { fg: 'green', border: 'green' }, duration = 2000, focusAfter = null) {
    const box = (style.fg === 'red') ? errorBox : messageBox;
    box.setLabel(` ${title} `);
    box.setContent(text);
    box.style.fg = style.fg || 'white';
    box.style.border.fg = style.border || 'green';
    box.setFront();
    box.show();
    box.focus();
    screen.render();

    let timer = null;

    const closeMessage = () => {
        if(timer) clearTimeout(timer);
        
        if (box.visible) {
             box.hide();
        if (typeof focusAfter === 'function') {
                 focusAfter(); 
        } else if (focusAfter && focusAfter.visible && !focusAfter.hidden) {
                 focusAfter.focus(); 
        } else {
                 focusDefaultElement(); 
        }
             screen.render();
         }
    };

    box.onceKey(['enter', 'escape'], closeMessage);
    timer = setTimeout(closeMessage, duration);
}

function formatMenuItem(label, value, width, placeholder = 'Not Defined Yet') {
    const paddingNeeded = Math.max(0, width - label.length);
    const displayValue = (value !== null && value !== undefined && value !== '') ? value : placeholder;
    return `${label}${' '.repeat(paddingNeeded)} >> ${displayValue}`;
}

function updateRTUMenu() {
    const labels = ['SerialCom', 'Start Address', 'Address', 'Function', 'Baud Rate', 'Architecture', 'Signal', 'Type', 'Parity', 'Stop Bits', 'Data Bits', 'Description'];
    const maxLabelWidth = Math.max(...labels.map(l => l.length));
    rtuMenu.setItems([
        formatMenuItem('SerialCom', selectedOptions.serialCom, maxLabelWidth),
        formatMenuItem('Start Address', selectedOptions.startAddress, maxLabelWidth),
        formatMenuItem('Address', selectedOptions.address, maxLabelWidth),
        formatMenuItem('Function', selectedOptions.function, maxLabelWidth),
        formatMenuItem('Baud Rate', selectedOptions.baudRate, maxLabelWidth),
        formatMenuItem('Architecture', selectedOptions.architecture, maxLabelWidth),
        formatMenuItem('Signal', selectedOptions.signal, maxLabelWidth),
        formatMenuItem('Type', selectedOptions.type, maxLabelWidth),
        formatMenuItem('Parity', selectedOptions.parity, maxLabelWidth),
        formatMenuItem('Stop Bits', selectedOptions.stopBits, maxLabelWidth),
        formatMenuItem('Data Bits', selectedOptions.dataBits, maxLabelWidth),
        formatMenuItem('Description', selectedOptions.description, maxLabelWidth, '...'),
        '',
        `[SAVE]${selectedOptions.filename ? '(Editing: ' + selectedOptions.filename + ')' : ''}`,
        '<< BACK'
    ]);
}

function showSelectionMenu(title, options, currentValue, callback, parentMenuToFocus) {
    const menu = blessed.list({ 
        parent: screen, 
        top: 'center', 
        left: 'center', 
        width: '50%', 
        height: '70%',
        keys: true, 
        mouse: true, 
        interactive: true, 
        tags: true,
        border: 'line', 
        label: ` ${title} `,
        items: [...options.map(opt => ` ${opt}`), '', ' << Back'],
        style: { selected: { bg: 'blue', fg: 'white' }, border: { fg: 'white' }, item: { fg: 'white', height: 1 } }
    });

    const currentIndex = options.findIndex(opt => opt === currentValue);
    if (currentIndex !== -1) menu.select(currentIndex);

    menu.setFront(); 
    menu.show();
    menu.focus();
    screen.render(); 

    const closeMenu = (valueToCallback) => {
        menu.destroy(); 
        if (parentMenuToFocus && parentMenuToFocus.visible && !parentMenuToFocus.hidden) {
             parentMenuToFocus.focus();
        } else {
            focusDefaultElement();
        }
        if (valueToCallback !== null) {
            callback(valueToCallback);
        if(parentMenuToFocus === rtuMenu) 
            updateRTUMenu(); 
        }
         screen.render(); 
    };

    menu.on('select', (item) => {
        const selectedContent = item.content.trim();
        if (selectedContent === '<< Back') 
            closeMenu(null);
        else if (selectedContent !== '') {
            const matchedOption = options.find(opt => ` ${opt}`.trim() === selectedContent);
            closeMenu(matchedOption || selectedContent);
        }
    });
    menu.key('escape', () => closeMenu(null));
}

// Barra de pesquisa e filtro/ atualiza os ficheiros
function refreshFileList(searchTerm = '', filter = { type: 'All Files', value: null }) {
    contentBox.setLabel(' Load Configuration (Reading...) '); 
    loadMenu.setItems([' Reading files...']); 
    loadMenu.select(0);
    screen.render(); 

    process.nextTick(() => {
         let files = [];
         try {
             files = fs.readdirSync(savedConfigsDir).filter(file => file.endsWith('.json'));
         } catch (err) {
             contentBox.setLabel(' Load Error{/} '); 
             loadMenu.setItems([` Error reading directory: ${err.code}`, '', ' [SEARCH]', ' [FILTER]', ' << Back']);
             screen.render();
             return;
         }
 //filtro
         let filteredFiles = files;
         
         if (searchTerm) {
             const lowerSearchTerm = searchTerm.toLowerCase();
             filteredFiles = filteredFiles.filter(file => file.toLowerCase().includes(lowerSearchTerm) );
         }

        let filterApplied = false;
        if (filter.type !== 'All Files' && filter.value !== null) {
            filterApplied = true;
            filteredFiles = filteredFiles.filter(file => {
                const filePath = path.join(savedConfigsDir, file);
                try {
                    const config = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    switch (filter.type) {
                        case 'By Baud Rate': return config.baudRate === filter.value;
                        case 'By Function': return config.function === filter.value;
                        default: return true;
                    }
                } catch (err) { return false; } 
            });
        }

        
         const menuLabel = ` Load Configuration ${searchTerm ? `[Search: "${searchTerm}"]` : ''} ${filterApplied ? `[Filter: ${filter.type}=${filter.value}]` : ''} `;
        
         //label para o contentBox
         contentBox.setLabel(menuLabel);

         // Atualiza os itens do loadMenu
         if (filteredFiles.length === 0) {
             loadMenu.setItems([' No matching configurations found.', '', ' [SEARCH]', ' [FILTER]', ' << Back']);
         } else {
             filteredFiles.sort((a, b) => a.localeCompare(b));
             loadMenu.setItems([...filteredFiles.map(f => ` ${f}`), '', ' [SEARCH]', ' [FILTER]', ' << Back']);
         }

         loadMenu.select(0); 
         screen.render();
    });
}


// EVENTOS

// Seleção do menu principal 
mainMenu.on('select', (item, index) => {
    const selectedItem = item.content.trim();
    createMenu.hide();
    loadMenu.hide();
    rtuMenu.hide();

    if (selectedItem.startsWith('1-Create')) {
        selectedOptions = { ...initialSelectedOptions };
        updateRTUMenu();
        contentBox.setLabel(' Select Connection Type '); 
        contentBox.show();
        createMenu.show();
        createMenu.focus();
    } 
    else if (selectedItem.startsWith('2-Load')) {
        contentBox.setLabel(' Load Configuration '); 
        contentBox.show();
        loadMenu.show(); 
        refreshFileList(); 
        loadMenu.focus();
    } 

    else if (selectedItem.startsWith('3-Exit')) {
        screen.destroy();
        return process.exit(0);
    }
    screen.render();
});

// Seleção de menu de criação (RTU ou TCP)
createMenu.on('select', (item) => {
    const selectedItem = item.content.trim();
    if (selectedItem === 'RTU') {
        createMenu.hide(); 
        contentBox.setLabel(' Configure RTU Settings ');
        updateRTUMenu(); 
        rtuMenu.show(); 
        rtuMenu.focus();
        screen.render(); 
    } 
    else if (selectedItem.startsWith('TCP')) {  //POR COMPLETAR!!!!!
         showTemporaryMessage('Info', 'TCP connection type is not yet implemented.', { fg: 'yellow', border: 'yellow' }, 2000, createMenu);
    } 
    else if (selectedItem === '<< Back') {
        createMenu.hide(); 
        contentBox.hide(); 
        mainMenu.focus(); 
        screen.render(); 
    }
});

// Seleção do menu RTU (configurações)
rtuMenu.on('select', (item, index) => {
    const selectedItemText = item.content.trim().replace(/{.*?}/g, ''); 

    if (selectedItemText.startsWith('<< BACK')) {
        rtuMenu.hide(); 
        contentBox.setLabel(' Select Connection Type '); 
        createMenu.show(); 
        createMenu.focus();
        screen.render();
        return;
    }
    if (selectedItemText.startsWith('[SAVE]')) {
        if (!selectedOptions.address || selectedOptions.address.trim() === '') {
            showTemporaryMessage('Warning', 'Address must be set before saving.', { fg: 'yellow', border: 'yellow' }, 2500, rtuMenu);
        } 
        else {
            saveAsBox.setValue(selectedOptions.filename ? selectedOptions.filename.replace('.json', '') : '');
            saveAsBox.setFront(); 
            saveAsBox.show();
            saveAsBox.focus();
            screen.render(); 
        }
        return;
    }
    if (selectedItemText === '') 
        { return; } 

    //Eventos de seleção de configuração, exibe o menu de seleção de cada configuração
    switch (index) {
         case 0: 
         showSelectionMenu(
            'Serial Port', 
            serialComOptions, 
            selectedOptions.serialCom, 
            (v) => { selectedOptions.serialCom = v; }, 
            rtuMenu); 
            break;

         case 1: 
         showSelectionMenu(
            'Start Address', 
            startAddressOptions, 
            selectedOptions.startAddress, (v) => { selectedOptions.startAddress = v; }, 
            rtuMenu); 
            break;

         case 2:
            addressBox.setValue(selectedOptions.address || '');
            addressBox.setFront(); 
            addressBox.show();
            addressBox.focus();
            screen.render();
            break;

         case 3: 
         showSelectionMenu(
            'Function', 
            functionOptions, 
            selectedOptions.function, 
            (v) => { selectedOptions.function = v; }, 
            rtuMenu); 
            break;

         case 4: 
         showSelectionMenu(
            'Baud Rate', 
            baudRateOptions, 
            selectedOptions.baudRate, 
            (v) => { selectedOptions.baudRate = v; }, 
            rtuMenu); 
            break;

         case 5: 
         showSelectionMenu(
            'Architecture', 
            architectureOptions, 
            selectedOptions.architecture, 
            (v) => { selectedOptions.architecture = v; }, 
            rtuMenu); 
            break;

         case 6: 
         showSelectionMenu(
            'Signal', 
            signalOptions, 
            selectedOptions.signal, 
            (v) => { selectedOptions.signal = v; }, 
            rtuMenu); 
            break;

         case 7: 
         showSelectionMenu(
            'Type', 
            typeOptions, 
            selectedOptions.type, (v) => { selectedOptions.type = v; }, 
            rtuMenu); 
            break;

         case 8: 
         showSelectionMenu(
            'Parity', 
            parityOptions, 
            selectedOptions.parity, (v) => { selectedOptions.parity = v; }, 
            rtuMenu); 
            break;

         case 9: 
         showSelectionMenu(
            'Stop Bits', 
            stopBitsOptions, 
            selectedOptions.stopBits, (v) => { selectedOptions.stopBits = v; }, 
            rtuMenu); 
            break;

         case 10: 
         showSelectionMenu(
            'Data Bits', 
            dataBitsOptions, 
            selectedOptions.dataBits, (v) => { selectedOptions.dataBits = v; }, 
            rtuMenu); 
            break;

         case 11:
             descriptionBox.setValue(selectedOptions.description || '');
             descriptionBox.setFront(); 
             descriptionBox.show();
             descriptionBox.focus();
             screen.render(); 
             break;

         default: rtuMenu.focus(); screen.render(); break; 
    }
});

// Caixas de Texto 

addressBox.on('submit', (value) => {
    const trimmedValue = value.trim();
    addressBox.hide();
    let isValid = false;
    if (/^\d+$/.test(trimmedValue)) 
        {
        selectedOptions.address = trimmedValue; 
        isValid = true;
        updateRTUMenu();
        rtuMenu.focus(); 
        screen.render(); 
    } 
    else if (trimmedValue === '') 
        {
         selectedOptions.address = ''; 
         isValid = true;
         updateRTUMenu();
         showTemporaryMessage('Info', 'Address cleared.', { fg: 'yellow', border: 'yellow' }, 1500, rtuMenu);
    } 
    else 
    {
        showTemporaryMessage('Error', 'Invalid Address! Only numbers allowed.', { fg: 'red', border: 'red' }, 2500, rtuMenu);
    }
});

addressBox.on('cancel', () => {
    addressBox.hide(); rtuMenu.focus(); screen.render(); 
});


descriptionBox.on('submit', (value) => {
    selectedOptions.description = value.trim();
    descriptionBox.hide(); 
    updateRTUMenu(); 
    rtuMenu.focus(); 
    screen.render(); 
});

descriptionBox.on('cancel', () => {
    descriptionBox.hide(); 
    rtuMenu.focus(); 
    screen.render(); 
});


saveAsBox.on('submit', (filenameInput) => {
    const filename = filenameInput.trim();
    saveAsBox.hide(); 

    if (filename === '') 
        {
         showTemporaryMessage('Error', 'Filename cannot be empty.', { fg: 'red', border: 'red' }, 2500, rtuMenu);
         return; 
    }

    let sanitizedFilename = filename.replace(/[^\w.-]+/g, '_'); 

    if (!sanitizedFilename.toLowerCase().endsWith('.json')) {
        sanitizedFilename += '.json';
    }

    const filePath = path.join(savedConfigsDir, sanitizedFilename);
    const dataToSave = { ...selectedOptions };
    delete dataToSave.filename;


//guardar o ficheiro
    try {
        fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2));
        selectedOptions.filename = sanitizedFilename; 

        const navigateToMainMenu = () => {
            if (rtuMenu.visible && !rtuMenu.hidden) 
                rtuMenu.hide();
            if (contentBox.visible && !contentBox.hidden) 
                contentBox.hide();
            if (mainMenu.visible && !mainMenu.hidden) 
                mainMenu.focus();
            else focusDefaultElement(); 
        };

        // mensagem de sucesso
        showTemporaryMessage(
            'Success',
            `Configuration saved as:\n${sanitizedFilename}`,
            { fg: 'green', border: 'green' },
            2000, //tempo da mensagem no ecrâ em ms
            navigateToMainMenu 
        );

    } 
    catch (err) {
        
        showTemporaryMessage(
            'Save Error',
            `Failed to save file:\n${err.message}`,
            { fg: 'red', border: 'red' },
            3000,
            rtuMenu 
        );
    }
});

// Load, Pesquisa, filtro

// Menu Load 
loadMenu.on('select', (item, index) => {
    const selectedItem = item.content.trim();

    if (selectedItem === '<< Back') 
        {
        loadMenu.hide(); 
        contentBox.hide(); 
        mainMenu.focus(); 
        screen.render(); 
    } 
    else if (selectedItem === '[SEARCH]') {
        searchBox.setValue('');
        searchBox.setFront(); 
        searchBox.show();
        searchBox.focus();
        screen.render(); 
    } 
    else if (selectedItem === '[FILTER]') {
        filterMenu.select(0);
        filterMenu.setFront(); 
        filterMenu.show();
        filterMenu.focus();
        screen.render(); 
    } 
    else if (selectedItem && !selectedItem.startsWith('[') && !selectedItem.startsWith('No matching') && !selectedItem.startsWith('Reading files') && !selectedItem.startsWith('Error reading') && selectedItem !== '') {
         const fileName = selectedItem;
         const filePath = path.join(savedConfigsDir, fileName);
         try {
             const fileContent = fs.readFileSync(filePath, 'utf8');
             const loadedConfig = JSON.parse(fileContent);
             selectedOptions = { ...initialSelectedOptions, ...loadedConfig, filename: fileName };

             loadMenu.hide(); 
             contentBox.setLabel(' Configure RTU Settings (Loaded)');
             updateRTUMenu();
             rtuMenu.show(); 
             rtuMenu.focus();
             screen.render(); 

             showTemporaryMessage('Loaded', `Loaded configuration:\n${fileName}`, { fg: 'cyan', border: 'cyan' }, 1500, rtuMenu);

         } 
         catch (err) {
             showTemporaryMessage('Load Error', `Failed to load ${fileName}:\n${err.message}`, { fg: 'red', border: 'red' }, 3000, loadMenu);
         }
    }
});

// Evento ao selecionar search para pesquisa
searchBox.on('submit', (value) => {
    searchBox.hide();
    refreshFileList(value.trim(), { type: 'All Files', value: null });
    loadMenu.focus();
});
searchBox.on('cancel', () => {
    searchBox.hide(); 
    loadMenu.focus(); 
    screen.render(); 
});

// Evento ao selecionar filter para filtrar os ficheiros
filterMenu.on('select', (item) => {
    const filterType = item.content.trim();
    filterMenu.hide(); 

    if (filterType === '<< Back') 
        {
        loadMenu.focus(); 
        screen.render(); 
        return; 
    }
    if (filterType === 'All Files') 
        {
        refreshFileList('', { type: 'All Files', value: null });
        loadMenu.focus();
    } 
    else 
    {
        let options = []; 
        let title = `Select ${filterType.replace('By ', '')}`;

        switch (filterType) {
             case 'By Baud Rate': options = baudRateOptions; break;
             case 'By Function': options = functionOptions; break;
             default:
                 showTemporaryMessage('Error', `Filter type "${filterType}" not implemented.`, { fg: 'red', border: 'red' }, 2500, loadMenu);
                 return;
        }

        
        showSelectionMenu(title, options, null, (selectedValue) => {
            if(selectedValue !== null) {
               refreshFileList('', { type: filterType, value: selectedValue });
            }
        }, loadMenu);
    }
});


// Teclas de atalho
screen.key(['escape'], () => {
    const activePopup = [addressBox, descriptionBox, saveAsBox, searchBox, filterMenu, messageBox, errorBox]
                          .concat(screen.children.filter(c => c.type === 'list' && c.options.parent === screen)) 
                          .find(el => el && el.visible && !el.hidden);

    if (activePopup) {
        if (typeof activePopup.cancel === 'function') {
            activePopup.cancel(); 
        }
        else if (activePopup === messageBox || activePopup === errorBox) {
            activePopup.hide();
            focusDefaultElement();
            screen.render();
        }
        
        else if (activePopup.type === 'list' && activePopup.items.find(i => i.content.trim() === '<< Back')) {
             screen.render();
        }
        else { 
            activePopup.hide();
            focusDefaultElement();
            screen.render();
        }
    } else { 
        const visibleContentMenu = getVisibleContentMenu();
        if (visibleContentMenu === rtuMenu) {
            rtuMenu.hide(); 
            contentBox.setLabel(' Select Connection Type ');
            createMenu.show(); 
            createMenu.focus(); 
            screen.render();
        } 
        else if (visibleContentMenu === createMenu || visibleContentMenu === loadMenu) {
            if(createMenu.visible) createMenu.hide();
            if(loadMenu.visible) loadMenu.hide();
            contentBox.hide(); 
            mainMenu.focus(); 
            screen.render();
        } 
        else if (mainMenu.focused) {
            screen.destroy(); 
            return process.exit(0);
        } 
        else { 
             if(contentBox.visible) contentBox.hide();
             mainMenu.focus(); screen.render();
        }
    }
});

screen.key(['C-c'], () => { screen.destroy(); 
    return process.exit(0); });

// inicializa o ecrâ
function initializeApp() {
    updateRTUMenu(); 
    mainMenu.focus();
    screen.render();
}
initializeApp();