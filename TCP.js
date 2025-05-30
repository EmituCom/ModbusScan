

const blessed = require('blessed');
const ModbusRTU = require('modbus-serial');
const { exec } = require('child_process');
const createLegend = require('./modules/legend');
const { createTable, tableHeader, columnWidths,  } = require('./modules/table');
const formatValue = require('./modules/formatValue');

console.log('Starting script...');

// Configuração
const MODBUS_DEVICE_IP = "127.0.0.1";
const MODBUS_PORT = 502;
const MODBUS_SERIAL_PORT = "COM5";
const MODBUS_SERIAL_OPTIONS = {
    baudRate: 9600,
    dataBits: 8,
    stopBits: 1,
    parity: 'none'
};

const MODBUS_SLAVE_ID = 1;
const CONNECTION_RETRY_MS = 5000;
const MODBUS_TIMEOUT_MS = 2000;

// Configuração para Auto-Scan
const AUTO_SCAN = true;
const SCAN_START_ADDRESS = 0;
const SCAN_END_ADDRESS = 50;
const SCAN_QUANTITY = 1;

const SCAN_TYPES = ['HoldingRegister', 'InputRegister', 'Coil', 'DiscreteInput'];

let REGISTERS_CONFIG = [];

if (AUTO_SCAN) {

    for (const type of SCAN_TYPES) {
        let quantity = SCAN_QUANTITY;
        let format = 'int16';
        if (type === 'Coil' || type === 'DiscreteInput') {
            quantity = 1;
            format = 'bool';
        }

        for (let address = SCAN_START_ADDRESS; address <= SCAN_END_ADDRESS; address += quantity) {
            REGISTERS_CONFIG.push({
                description: `Addr ${address} (${type.substring(0,4)})`,
                address,
                quantity,
                type,
                format,
                unit: '',
                slaveId: MODBUS_SLAVE_ID
            });
        }
    }

    console.log(`AUTO_SCAN enabled. Populated ${REGISTERS_CONFIG.length} registers.`);

}

// Variáveis Globais
const client = new ModbusRTU();
let isModbusConnected = false;
let connectionAttemptTimeoutId = null;
let lastUpdateTime = null;
let overallStatus = "Initializing";
let currentProgress = 0;
let currentFilter = { column: null, value: '' };
let currentSearch = '';
let helpVisible = false;
let isInputActive = false;
let isTableUpdated = false;

console.log('Creating blessed screen...');

// Cria a tela blessed
const screen = blessed.screen({
    smartCSR: true,
    title: 'Modbus Monitor',
    fullUnicode: true
});

console.log('Setting up main interface elements...');

// Adiciona a legenda usando o módulo importado
const legend = createLegend(screen);

// Interface
const headerBox = blessed.text({
    parent: screen,
    top: 0,
    left: 0,
    width: '100%',
    height: 1,
    content: ' Initializing...',
    style: { fg: 'black', bg: 'cyan' },
    tags: true
});

// Adiciona a tabela usando o módulo importado
const Table = createTable(screen);
Table.focus();


function getArchitecture(format) {

    format = format.toLowerCase();
    if (format.includes('float32') || format.includes('int32') || format.includes('uint32'))
        return '32-bit';

    if (format.includes('int16') || format.includes('uint16'))
        return '16-bit';

    if (format.includes('bool'))
        return '1-bit';

    return 'N/A';

}

const table = blessed.listtable({
    parent: screen,
    top: 1,
    left: 0,
    width: '100%',
    height:screen.height - 3,
    border: { type: 'line' },
    align: 'left',
    tags: true,
    keys: true,
    vi: true,
    mouse: true,
    noCellBorders: true,
    style: {
        border: { fg: 'grey' },
        header: { fg: 'black', bg: 'white', bold: true },
        cell: { fg: 'white', selected: { bg: 'blue', fg: 'white' } }
    },

    data: [tableHeader]

});


// F1
const helpBox = blessed.box({
    parent: screen,
    top: 'center',
    left: 'center',
    width: '50%',
    height: '50%',
    label: ' {bold}Help{/} ',
    content: `{bold}Keys:{/}
  {bold} ↑ /↓ {/}: Scroll table
  {bold}F1{/}: show this help screen
  {bold}F2{/}: Setup
  {bold}F3{/}: Filter by column
  {bold}F4 or /{/}: Search across all columns
  {bold}F5{/}: Clear filter and search
  {bold}F6{/}: Force new read of registers
  {bold}F10 or q or Ctrl+C{/}: Quit`,
    border: { type: 'line' },
    style: {
        border: { fg: 'green' },
        label: { fg: 'white', bg: 'green' },
        fg: 'white',
        bg: 'black'
    },
    hidden: true,
    tags: true
});

// F3
const filterColumnSelector = blessed.list({
    parent: screen,
    top: 'center',
    left: 'center',
    width: '30%',
    height: tableHeader.length + 2,
    label: ' Select Filter Column',
    border: { type: 'line' },
    style: {
        border: { fg: 'cyan' },
        label: { fg: 'white', bg: 'cyan' },
        selected: { bg: 'blue', fg: 'white' },
        item: { fg: 'white' },
        bg: 'black'
    },
    hidden: true,
    keys: true,
    items: tableHeader.map((header, index) => `${index}: ${header.replace(/{.*?}/g, '')}`)
});

const filterInput = blessed.textbox({
    parent: screen,
    top: 'center',
    left: 'center',
    width: '50%',
    height: 3,
    label: 'Filter Value',
    inputOnFocus: true,
    border: { type: 'line' },
    style: {
        border: { fg: 'cyan' },
        label: { fg: 'white', bg: 'cyan' },
        fg: 'white',
        bg: 'black'
    },
    hidden: true,
    keys: true
});

// F4
const searchInput = blessed.textbox({
    parent: screen,
    top: 'center',
    left: 'center',
    width: '50%',
    height: 3,
    label: ' Search',
    inputOnFocus: true,
    border: { type: 'line' },
    style: {
        border: { fg: 'cyan' },
        label: { fg: 'white', bg: 'cyan' },
        fg: 'white',
        bg: 'black'
    },
    hidden: true,
    keys: true
});

console.log('Focusing table...');
table.focus();



// Conexão
function connectModbus() {
    if (client.isOpen || isModbusConnected)

        return;

    overallStatus = '{yellow-fg}Connecting...{/}';
    updateStatus();
    clearTimeout(connectionAttemptTimeoutId);

    const connectPromise = MODBUS_DEVICE_IP
        ? client.connectTCP(MODBUS_DEVICE_IP, { port: MODBUS_PORT })
        : client.connectRTUBuffered(MODBUS_SERIAL_PORT, MODBUS_SERIAL_OPTIONS);
    connectPromise
        .then(() => {
            client.setTimeout(MODBUS_TIMEOUT_MS);
            isModbusConnected = true;
            overallStatus = '{green-fg}Connected{/}';
            const target = MODBUS_DEVICE_IP ? `${MODBUS_DEVICE_IP}:${MODBUS_PORT}` : MODBUS_SERIAL_PORT;
            updateStatus(`Connected to ${target}. Starting read...`, -1);
            startReading();
        })
        .catch((err) => {
            isModbusConnected = false;
            overallStatus = `{red-fg}Connection Failed{/}`;
            updateStatus(`Connection failed: ${err.message.substring(0, 30)}. Retrying...`, -1);
            connectionAttemptTimeoutId = setTimeout(connectModbus, CONNECTION_RETRY_MS);
        });
}

// Função para Atualizar Header
function updateStatus(currentAction = overallStatus, progress = currentProgress) {
    const timeStr = lastUpdateTime ? lastUpdateTime.toLocaleTimeString() : 'N/A';
    let connectionStr = "{red-fg}Disconnected{/}";
    if (isModbusConnected && client.isOpen) {
        const target = MODBUS_DEVICE_IP ? `${MODBUS_DEVICE_IP}:${MODBUS_PORT}` : MODBUS_SERIAL_PORT;
        connectionStr = `{green-fg}ONLINE{/} (${target})`;
    } else if (overallStatus.includes('Connecting')) {
        connectionStr = '{yellow-fg}Connecting...{/}';
    }
    let progressBar = '';
    if (progress >= 0 && progress <= 100) {
        const barLength = 10;
        const filledChars = Math.round(barLength * progress / 100);
        const emptyChars = barLength - filledChars;
        progressBar = ` [${'='.repeat(filledChars)}${'>'.repeat(emptyChars)}] ${progress.toFixed(0)}% |`;
    }

    let filterIndicator = currentFilter.column !== null && currentFilter.value ? ` {yellow-fg}Filter: ${tableHeader[currentFilter.column].replace(/{.*?}/g, '')}=${currentFilter.value}{/}` : '';
    let searchIndicator = currentSearch ? ` {yellow-fg}Search: ${currentSearch}{/}` : '';
    headerBox.setContent(` ${progressBar} Modbus: ${connectionStr} | Status: ${currentAction} | Last Read: ${timeStr}${filterIndicator}${searchIndicator}`);
    if (!isInputActive && !helpVisible)
        screen.render();
}

// Função para fazer a leitura inicial (1x)
function startReading() {
    if (!isTableUpdated) {
        readAndUpdateTable();
        isTableUpdated = true;
    }
}

// Função para ler e atualizar a tabela
async function readAndUpdateTable() {
    if (!isModbusConnected || !client.isOpen || isInputActive) {
        updateStatus(`Waiting for connection...`, -1);
        return;
    }
    const totalRegisters = REGISTERS_CONFIG.length;
    let readCount = 0;
    const allRowsData = [];
    overallStatus = '{yellow-fg}Reading...{/}';
    updateStatus();
    for (const reg of REGISTERS_CONFIG) {
        let valueStr = '{grey-fg}Pending...{/}';
        let statusStr = '{yellow-fg}Wait{/}';
        let readData = null;

        try {
            if (!client.isOpen) {
                throw new Error("Connection closed unexpectedly");
            }
            client.setID(reg.slaveId);

            switch (reg.type) {
                case "HoldingRegister":
                    readData = await client.readHoldingRegisters(reg.address, reg.quantity);
                    break;
                case "InputRegister":
                    readData = await client.readInputRegisters(reg.address, reg.quantity);
                    break;
                case "Coil":
                    readData = await client.readCoils(reg.address, reg.quantity);
                    break;
                case "DiscreteInput":
                    readData = await client.readDiscreteInputs(reg.address, reg.quantity);
                    break;
                default:
                    throw new Error(`Unsupported type: ${reg.type}`);
            }
            valueStr = formatValue(readData, reg.format, reg.unit);
            statusStr = '{green-fg}OK{/}';

        } catch (err) {
            valueStr = '{red-fg}Error{/}';

            if (err.modbusCode) {
                statusStr = `{red-fg}ERROR ${err.modbusCode}{/}`;
            } else if (err.message.includes('Timed out')) {
                statusStr = `{red-fg}Timeout{/}`
            } else if (err.message.includes('Port Not Open')) {
                statusStr = `{red-fg}Port Closed{/}`;
                isModbusConnected = false;
                client.close(() => {});
                connectModbus();
                return;
            } else {
                statusStr = `{red-fg}Read Fail{/}`;
            }
        } finally {
            const rowData = [

                String(reg.slaveId).padStart(columnWidths[0]),
                String(reg.address).padStart(columnWidths[1]),
                reg.type.padEnd(columnWidths[2]),
                reg.format.padEnd(columnWidths[3]),
                valueStr.padEnd(columnWidths[4]),
                getArchitecture(reg.format).padEnd(columnWidths[5]),
                reg.description.substring(0, columnWidths[6] - 1).padEnd(columnWidths[6]),
                statusStr
            ];
            allRowsData.push(rowData);
            readCount++;
            currentProgress = (readCount / totalRegisters) * 100;
            if (readCount % 5 === 0 || readCount === totalRegisters) {
                updateStatus(`Reading ${readCount}/${totalRegisters}...`, currentProgress);
            }
        }
    }

// Filtro
    let filteredData = allRowsData;
    if (currentFilter.column !== null && currentFilter.value) {
        const filterRegex = new RegExp(currentFilter.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        filteredData = filteredData.filter(row =>
            filterRegex.test(String(row[currentFilter.column]).replace(/{.*?}/g, ''))
        );
    }

// Search
    if (currentSearch) {
        const searchRegex = new RegExp(currentSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        filteredData = filteredData.filter(row =>
            row.some(cell => searchRegex.test(String(cell).replace(/{.*?}/g, '')))
        );
    }

 // Atualizar a tabela
    try {
        table.setData([tableHeader, ...filteredData]);
        screen.render();
    } catch (e) {
        overallStatus = '{red-fg}Table Update Err{/}';
        console.error('Table update error:', e.message);
    }
    lastUpdateTime = new Date();
    overallStatus = '{green-fg}Read Complete{/}';
    updateStatus();
}

// Função para limpar e sair

function cleanupAndExit(exitCode = 0) {
    console.log('Cleaning up and exiting...');
    if (connectionAttemptTimeoutId) clearTimeout(connectionAttemptTimeoutId);
    if (client && client.isOpen) {
        client.close(() => {});
    }
    isModbusConnected = false;
    screen.destroy();
    console.log("\nModbus Monitor stopped. Press Ctrl+C to close.");
    process.exit(exitCode);
}

// Eventos

console.log('Setting up key handlers...');
screen.key(['q', 'C-c', 'f10'], () => {
    cleanupAndExit();
});

screen.key(['f1'], () => {

    if (isInputActive) 
    return;
    helpVisible = !helpVisible;
    if (helpVisible) {
        helpBox.show();
        helpBox.focus();
    } else {
        helpBox.hide();
        table.focus();
    }
    screen.render();
});


screen.key(['f2'], () => {
    if (isInputActive || helpVisible) return;
    const command = process.platform === 'win32' ? 'start node interface1.js' : 'node interface1.js &';
    exec(command, (err) => {
        if (err) {
            console.error('Error launching Interface 1:', err.message);
            overallStatus = '{red-fg}Interface 1 Failed{/}';
            updateStatus();
        } else {
            overallStatus = '{green-fg}Interface 1 Launched{/}';
            updateStatus();
            table.focus();
            screen.render();
        }
    });
});

screen.key(['f3'], () => {
    if (isInputActive || helpVisible) 
    return;
    isInputActive = true;
    filterColumnSelector.show();
    filterColumnSelector.focus();
    screen.render();
});

filterColumnSelector.key(['enter'], () => {
    currentFilter.column = filterColumnSelector.selected;
    filterColumnSelector.hide();
    filterInput.show();
    filterInput.focus();
    screen.render();
});

filterColumnSelector.key(['escape'], () => {
    filterColumnSelector.hide();
    currentFilter = { column: null, value: '' };
    isInputActive = false;
    currentProgress = 0;
    updateStatus('{magenta-fg}Filter Cancelled...{/}', -1);
    readAndUpdateTable();
    table.focus();
    screen.render();
});

filterInput.key(['enter'], () => {
    currentFilter.value = filterInput.getValue().trim();
    filterInput.hide();
    filterInput.clearValue();
    isInputActive = false;
    currentProgress = 0;
    updateStatus('{magenta-fg}Applying Filter...{/}', -1);
    readAndUpdateTable();
    table.focus();
    screen.render();
});

filterInput.key(['escape'], () => {

    filterInput.hide();
    filterInput.clearValue();
    currentFilter = { column: null, value: '' };
    isInputActive = false;
    currentProgress = 0;
    updateStatus('{magenta-fg}Filter Cancelled...{/}', -1);
    readAndUpdateTable();
    table.focus();
    screen.render();
});

screen.key(['f4', '/'], () => {

    if (isInputActive || helpVisible) 
    return;
    isInputActive = true;
    searchInput.show();
    searchInput.focus();
    screen.render();
});

searchInput.key(['enter'], () => {
    currentSearch = searchInput.getValue().trim();
    searchInput.hide();
    searchInput.clearValue();
    isInputActive = false;
    currentProgress = 0;
    updateStatus('{magenta-fg}Applying Search...{/}', -1);
    readAndUpdateTable();
    table.focus();
    screen.render();
});

searchInput.key(['escape'], () => {
    searchInput.hide();
    searchInput.clearValue();
    currentSearch = '';
    isInputActive = false;
    currentProgress = 0;
    updateStatus('{magenta-fg}Search Cancelled...{/}', -1);
    readAndUpdateTable();
    table.focus();
    screen.render();
});

screen.key(['f5'], () => {
    if (isInputActive || helpVisible) return;
    currentFilter = { column: null, value: '' };
    currentSearch = '';
    currentProgress = 0;
    updateStatus('{magenta-fg}Clearing Filter/Search...{/}', -1);
    readAndUpdateTable();
    table.focus();
    screen.render();
});

screen.key(['f6'], () => {
    if (isInputActive || helpVisible) 
    return;
    isTableUpdated = false;
    overallStatus = '{cyan-fg}Initiating New Read...{/}';
    updateStatus();
    startReading();
    table.focus();
    screen.render();
});

screen.key(['escape'], () => {

    if (isInputActive) {
        if (!filterColumnSelector.hidden) {
            filterColumnSelector.hide();
            currentFilter = { column: null, value: '' };
        }
        if (!filterInput.hidden) {
            filterInput.hide();
            filterInput.clearValue();
            currentFilter = { column: null, value: '' };
        }
        if (!searchInput.hidden) {
            searchInput.hide();
            searchInput.clearValue();
            currentSearch = '';
        }
        isInputActive = false;
        currentProgress = 0;
        updateStatus('{magenta-fg}Cancelled Input...{/}', -1);
        readAndUpdateTable();
        table.focus();
        screen.render();
    } else if (helpVisible) {
        helpVisible = false;
        helpBox.hide();
        table.focus();
        screen.render();
    }
});

// Resize Handler
let resizeTimeout;

screen.on('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        table.height = screen.height - 3;
        if (!isInputActive && !helpVisible && isTableUpdated) 
    screen.render();
    }, 100);
});

// Início da Execução
console.log('Initializing UI...');
try {
    updateStatus();
    connectModbus();
    console.log('UI initialized successfully.');
} catch (e) {
    console.error('Error during initialization:', e.message);
    cleanupAndExit(1);
}