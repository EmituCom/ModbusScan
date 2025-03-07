const blessed = require('blessed');

// Criar tela principal
const screen = blessed.screen({
    smartCSR: true,
    title: 'Options Menu'
});

// Objeto para armazenar seleções
let selectedOptions = {
    function: null,
    baudRate: null
};

// Criar menu principal
const mainMenu = blessed.list({
    top: 'center',
    left: 'center',
    width: '50%',
    height: '50%',
    keys: true,
    mouse: true,
    interactive: true,
    items: ['1-Create >>', '2-Load', '3-Exit'],
    border: { type: 'line' },
    style: {
        selected: { bg: 'green' },
        border: { fg: 'white' },
        focus: { border: { fg: 'white' } }
    }
});

// Criar submenu "Create"
const createMenu = blessed.list({
    top: 'center',
    left: 'center',
    width: '50%',
    height: '50%',
    keys: true,
    mouse: true,
    interactive: true,
    hidden: true, // Começa escondido
    items: ['Function>>', 'Baud Rate>>', 'Save', '<< Back'],
    border: { type: 'line' },
    style: {
        selected: { bg: 'blue' },
        border: { fg: 'white' },
        focus: { border: { fg: 'white' } }
    }
});

// Criar Submenu "Function"
const functionMenu = blessed.list({
    top: 'center',
    left: 'center',
    width: '50%',
    height: '50%',
    keys: true,
    mouse: true,
    interactive: true,
    hidden: true, // Começa escondido
    items: [
        '01-Read Coils',
        '02-Read Discrete Inputs',
        '03-Read Holding Registers',
        '04-Read Input Registers',
        '05-Write Single Coil',
        '06-Write Single Register',
        '07-Write Multiple Coils',
        '08-Write Multiple Registers',
        '<< Back'
    ],
    border: { type: 'line' },
    style: {
        selected: { bg: 'magenta' },
        border: { fg: 'white' },
        focus: { border: { fg: 'white' } }
    }
});

// Criar submenu "Baud Rate"
const baudRateMenu = blessed.list({
    top: 'center',
    left: 'center',
    width: '50%',
    height: '50%',
    keys: true,
    mouse: true,
    interactive: true,
    hidden: true, // Começa escondido
    items: [
        '300',
        '600',
        '1200',
        '2400',
        '4800',
        '9600',
        '19200',
        '38400',
        '57600',
        '115200',
        '<< Back'
    ],
    border: { type: 'line' },
    style: {
        selected: { bg: 'yellow' },
        border: { fg: 'white' },
        focus: { border: { fg: 'white' } }
    }
});

// Criar tela de confirmação do "Save"
const saveMenu = blessed.box({
    top: 'center',
    left: 'center',
    width: '50%',
    height: '30%',
    hidden: true,
    border: { type: 'line' },
    style: {
        border: { fg: 'cyan' }
    }
});

// Evento ao selecionar opção do menu principal
mainMenu.on('select', (item, index) => {
    if (index === 0) { // Se escolher "1-Create >>"
        mainMenu.hide();
        createMenu.show();
        createMenu.focus();
    } else if (index === 2) { // Se escolher "3-Exit"
        process.exit(0);
    }
    screen.render();
});

// Evento ao selecionar opção do submenu "Create"
createMenu.on('select', (item, index) => {
    if (index === 0) { // Se escolher "Function>>"
        createMenu.hide();
        functionMenu.show();
        functionMenu.focus();
    } 
    else if (index === 1) { // Se escolher "Baud Rate>>"
        createMenu.hide();
        baudRateMenu.show();
        baudRateMenu.focus();  
    }
    else if (index === 2) { // Se escolher "Save"
        saveMenu.setContent(
            `📌 Configurações Salvas:\n\n Function: ${selectedOptions.function || 'Nenhuma'}\n Baud Rate: ${selectedOptions.baudRate || 'Nenhum'}\n\n Pressione a tecla enter para voltar.`
        );
        createMenu.hide();
        saveMenu.show();
        screen.render();
    }
    else if (index === 3) { // Se escolher "<< Back"
        createMenu.hide();
        mainMenu.show();
        mainMenu.focus();
    }
    screen.render();
});

// Evento ao selecionar opção do submenu "Function"
functionMenu.on('select', (item, index) => {
    if (index === 8) { // Se escolher "<< Back"
        functionMenu.hide();
        createMenu.show();
        createMenu.focus();
    } else {
        selectedOptions.function = item.content;
        console.log(`\n 🔹 Função escolhida: ${item.content}`);
    }
    screen.render();
});

// Evento ao selecionar opção do submenu "Baud Rate"
baudRateMenu.on('select', (item, index) => {
    if (index === 10) { // Se escolher "<< Back"
        baudRateMenu.hide();
        createMenu.show();
        createMenu.focus();
    } else {
        selectedOptions.baudRate = item.content;
        console.log(`\n \n🔹 Baud Rate escolhido: ${item.content}`);
    }
    screen.render();
});

// Evento para voltar do menu de salvamento
screen.key(['escape', 'enter'], () => {
    if (!saveMenu.hidden) {
        saveMenu.hide();
        createMenu.show();
        createMenu.focus();
        screen.render();
    }
});

// Adicionar menus à tela
screen.append(mainMenu);
screen.append(createMenu);
screen.append(functionMenu);
screen.append(baudRateMenu);
screen.append(saveMenu);

mainMenu.focus();
screen.render();

// Permitir sair com "ESC" ou "C"
screen.key(['escape', 'c'], () => {
    process.exit(0);
});


