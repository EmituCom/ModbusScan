const blessed = require('blessed');

// Criar tela principal
const screen = blessed.screen({
    smartCSR: true,
    title: 'Options Menu'
});

// Criar caixa do menu principal (à esquerda)
const menuBox = blessed.box({
    top: 'center',
    left: '5%',
    width: '30%',
    height: '80%',
    border: { type: 'line' },
    label: ' Main Menu ',
    style: { border: { fg: 'white' } }
});

// Criar caixa para exibir conteúdos selecionados (à direita)
const contentBox = blessed.box({
    top: 'center',
    left: '40%',
    width: '50%',
    height: '80%',
    border: { type: 'line' },
    content: 'Choose an option...',
    style: { border: { fg: 'cyan' } }
});

// Criar menu principal
const mainMenu = blessed.list({
    parent: menuBox,
    top: 1,
    left: 1,
    width: '90%',
    height: '90%',
    keys: true,
    mouse: true,
    interactive: true,
    items: ['1-Create >>', '2-Load', '3-Exit'],

    style: { selected: { bg: 'green' } }
});

// Criar submenu "Create"
const createMenu = blessed.list({
    top: 'center',
    left: '40%',
    width: '50%',
    height: '80%',
    keys: true,
    mouse: true,
    interactive: true,
    hidden: true,
    items: ['Function >>', 'Baud Rate >>', 'Type >>', 'Architecture >>', 'Signal >>', 'Description >>', 'Save', '<< Back'],
    border: { type: 'line' },
    style: { selected: { bg: 'blue' } }
});

// Criar submenu "Function"
const functionMenu = blessed.list({
    top: 'center',
    left: '40%',
    width: '50%',
    height: '80%',
    keys: true,
    mouse: true,
    interactive: true,
    hidden: true,
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
    style: { selected: { bg: 'magenta' } }
});

// Criar submenu "Baud Rate"
const baudRateMenu = blessed.list({
    top: 'center',
    left: '40%',
    width: '50%',
    height: '80%',
    keys: true,
    mouse: true,
    interactive: true,
    hidden: true,
    items: ['300', '600', '1200', '2400', '4800', '9600', '19200', '38400', '57600', '115200', '<< Back'],
    border: { type: 'line' },
    style: { selected: { bg: 'yellow' } }
});

//criar submenu "Type"
const typeMenu = blessed.list({
    top: 'center',
    left: '40%',
    width: '50%',
    height: '80%',
    keys: true,
    mouse: true,
    interactive: true,
    hidden: true,
    items: ['Signed', 'Unsigned', '<< Back'],
    border: { type: 'line' },
    style: { selected: { bg: 'red' } }
}); 


//criar submenu "Architecture"
const architectureMenu = blessed.list({
    top: 'center',
    left: '40%',
    width: '50%',
    height: '80%',
    keys: true,
    mouse: true,
    interactive: true,
    hidden: true,
        items: ['Little Endian', 'Big Endian', '<< Back'],
    border: { type: 'line' },
    style: { selected: { bg: 'white' } }
    });

// Criar tela de confirmação do "Save"
const saveMenu = blessed.box({
    top: 'center',
    left: '40%',
    width: '50%',
    height: '40%',
    hidden: true,
    border: { type: 'line' },
    label: ' Confirmação ',
    style: { border: { fg: 'cyan' } }
});

// Objeto para armazenar seleções
let selectedOptions = {
    function: null,
    baudRate: null,
    type: null,
    architecture: null,
    signal: null,
    description: null
};  

// Função para alternar menus
function showMenu(menu) {
    contentBox.hide(),
    createMenu.hide(),
    functionMenu.hide(),
    baudRateMenu.hide(),
    typeMenu.hide(),
    architectureMenu.hide(),
    signalMenu.hide(),
    saveMenu.hide(),
    menu.show(),
    menu.focus(),
    screen.render();
}

// Evento ao selecionar opção do menu principal
mainMenu.on('select', (item, index) => {
    if (index === 0) showMenu(createMenu);
    if (index === 1) contentBox.setContent('Change Defaults'); // Load
    if (index === 2) screen.destroy(); // Exit
    screen.render();
});

// Evento ao selecionar opção do submenu "Create"
createMenu.on('select', (item, index) => {
    if (index === 0) showMenu(functionMenu);
    if (index === 1) showMenu(baudRateMenu);
    if (index === 2) showMenu(typeButton);
    if (index === 3) showMenu(architectureButton);
    if (index === 4) showMenu(signalButton);
    if (index === 5) showMenu(descriptionButton);
    if (index === 6) {
        saveMenu.setContent(
            `Configurações Salvas:\n\n Function: ${selectedOptions.function || 'Nenhuma'}\n Baud Rate: ${selectedOptions.baudRate || 'Nenhum'}\n\n Pressione Enter para voltar.`
        );
        showMenu(saveMenu);
    }
});

// Evento ao selecionar opção do submenu "Function"
functionMenu.on('select', (item, index) => {
    if (index === 8) {
        showMenu(createMenu); // Se for "Back", volta para Create
    } else {
        selectedOptions.function = item.content;
        contentBox.setContent(`🔹 Função escolhida: ${item.content}`);
        setTimeout(() => showMenu(createMenu), 250); // Volta automaticamente após 250ms
    }
    screen.render();
});

// Evento ao selecionar opção do submenu "Baud Rate"
baudRateMenu.on('select', (item, index) => {
    if (index === 10) showMenu(createMenu);
    else {
        selectedOptions.baudRate = item.content;
        contentBox.setContent(`🔹 Baud Rate escolhido: ${item.content}`);
        setTimeout(() => showMenu(createMenu), 250); // Volta automaticamente após 250ms
    }
    screen.render();
});


// Evento para voltar do menu de salvamento
screen.key(['enter'], () => {
    if (!saveMenu.hidden) showMenu(createMenu);
});

// Adicionar menus à tela
screen.append(menuBox);
screen.append(contentBox);
screen.append(createMenu);
screen.append(functionMenu);
screen.append(baudRateMenu);
screen.append(saveMenu);

// Focar no menu inicial
mainMenu.focus();
screen.render();

// Permitir sair com "ESC" ou "C"
screen.key(['escape', 'c'], () => {
    process.exit(0);
});

// Função para alternar menus
function showMenu(menu) {
    contentBox.hide();
    createMenu.hide();
    functionMenu.hide();
    baudRateMenu.hide();
    saveMenu.hide();
    menu.show();
    menu.focus();
    screen.render();
}

// Evento ao selecionar opção do menu principal
mainMenu.on('select', (item, index) => {
    if (index === 0) showMenu(createMenu);
    if (index === 1) contentBox.setContent('📂 Carregando arquivos...'); // Load
    if (index === 2) screen.destroy(); // Exit
    screen.render();
});

// Evento ao selecionar opção do submenu "Create"
createMenu.on('select', (item, index) => {
    if (index === 0) showMenu(functionMenu);
    if (index === 1) showMenu(baudRateMenu);
    if (index === 2) showMenu(typeMenu);
    if (index === 3) showMenu(architectureMenu);
    if (index === 4) showMenu(signalMenu);
    if (index === 5) showMenu(descriptionMenu);
    if (index === 6) {
        saveMenu.setContent(
            `📌 Configurações Salvas:\n\n Function: ${selectedOptions.function || 'Nenhuma'}\n Baud Rate: ${selectedOptions.baudRate || 'Nenhum'}\n\n Pressione Enter para voltar.`
        );
        showMenu(saveMenu);
    }
    if (index === 7) showMenu(mainMenu);
});

// Evento ao selecionar opção do submenu "Function"
functionMenu.on('select', (item, index) => {
    if (index === 8) {
        showMenu(createMenu); // Se for "Back", volta para Create
    } else {
        selectedOptions.function = item.content;
        contentBox.setContent(`🔹 Função escolhida: ${item.content}`);
        setTimeout(() => showMenu(createMenu), 500); // Volta automaticamente após 500ms
    }
    screen.render();
});

// Evento ao selecionar opção do submenu "Baud Rate"
baudRateMenu.on('select', (item, index) => {
    if (index === 10) showMenu(createMenu);
    else {
        selectedOptions.baudRate = item.content;
        contentBox.setContent(`🔹 Baud Rate escolhido: ${item.content}`);
    }
    screen.render();
});

// Evento para voltar do menu de salvamento
screen.key(['enter'], () => {
    if (!saveMenu.hidden) showMenu(createMenu);
});

// Adicionar menus à tela
screen.append(menuBox);
screen.append(contentBox);
screen.append(createMenu);
screen.append(functionMenu);
screen.append(baudRateMenu);
screen.append(saveMenu);

// Focar no menu inicial
mainMenu.focus();
screen.render();

// Permitir sair com "ESC" ou "C"
screen.key(['escape', 'c'], () => {
    process.exit(0);
});
