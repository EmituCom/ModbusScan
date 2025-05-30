
const blessed = require('blessed');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Cria a tela blessed
const screen = blessed.screen({
    smartCSR: true,
    title: 'Modbus Connection Manager',
    fullUnicode: true
});

// Adiciona a legenda à tela
// LEGENDA
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

// Caixa com as opções
const menu = blessed.list({
    parent: screen,
    top: 'center',
    left: 'center',
    width: 50,
    height: 10,
    label: ' Options ',
    border: { type: 'line' },
    style: {
        border: { fg: 'cyan' },
        label: { fg: 'white', bg: 'cyan' },
        selected: { bg: 'blue', fg: 'white' },
        item: { fg: 'white' },
        bg: 'black'
    },
    keys: true,
    items: [
        '- RTU configuration',
        '- TCP configuration',
        '- Create new configuration'
    ]
});

// Foca o menu
menu.focus();

// Função para executar um script
function executeScript(scriptName) {
    const scriptPath = path.join(__dirname, scriptName);

    // Verifica se o arquivo existe
    if (!fs.existsSync(scriptPath)) {
        const errorBox = blessed.message({
            parent: screen,
            top: 'center',
            left: 'center',
            width: 40,
            height: 5,
            border: { type: 'line' },
            style: {
                border: { fg: 'red' },
                fg: 'white',
                bg: 'black'
            }
        });
        errorBox.display(`Erro: ${scriptName} não encontrado!`, 2, () => {
            menu.focus();
            screen.render();
        });
        return;
    }

    // Executa o script em um novo terminal (Windows) ou background (Linux)
    const command = process.platform === 'win32'
        ? ['cmd', '/c', 'start', 'cmd', '/k', 'node', scriptPath]
        : ['x-terminal-emulator', '-e', `node ${scriptPath}`];

    const scriptProcess = spawn(process.platform === 'win32' ? 'cmd' : 'x-terminal-emulator',
        command.slice(1),
        { cwd: __dirname, shell: true, detached: true }
    );

    scriptProcess.on('error', (err) => {
        const errorBox = blessed.message({
            parent: screen,
            top: 'center',
            left: 'center',
            width: 40,
            height: 5,
            border: { type: 'line' },
            style: {
                border: { fg: 'red' },
                fg: 'white',
                bg: 'black'
            }
        });
        errorBox.display(`Erro ao abrir ${scriptName}: ${err.message}`, 2, () => {
            menu.focus();
            screen.render();
        });
    });

    scriptProcess.on('close', (code) => {
        if (code !== 0) {
            const errorBox = blessed.message({
                parent: screen,
                top: 'center',
                left: 'center',
                width: 40,
                height: 5,
                border: { type: 'line' },
                style: {
                    border: { fg: 'red' },
                    fg: 'white',
                    bg: 'black'
                }
            });
            errorBox.display(`Falha ao abrir terminal (código ${code})`, 2, () => {
                menu.focus();
                screen.render();
            });
        }
    });

    scriptProcess.unref();
}

// Eventos do menu
menu.on('select', (item, index) => {
    switch (index) {
        case 0:
            executeScript('RTU.js');
            break;
        case 1:
            executeScript('TCP.js');
            break;
        case 2:
            executeScript('interface1.js');
            break;
    }
});

// Eventos de teclas
screen.key(['q', 'C-c', 'f10'], () => {
    screen.destroy();
    process.exit(0);
});

// Início da execução
try {
    screen.render();
} catch (e) {
    console.error('Error during initialization:', e.message);
    screen.destroy();
    process.exit(1);
}

