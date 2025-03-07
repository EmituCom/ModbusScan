const blessed = require('blessed');

// Criar a tela do terminal
const screen = blessed.screen({
  smartCSR: true,
  title: 'Radio Button com Blessed'
});

// Criar um box para os radio buttons
const form = blessed.form({
  parent: screen,
  keys: true,
  left: 'center',
  top: 'center',
  width: '50%',
  height: '50%',
  border: { type: 'line' },
  label: 'Escolha uma opção',
  style: {
    border: { fg: 'blue' },
    fg: 'white'
  }
});

// Criar um grupo de radio buttons
const radioSet = blessed.radiobutton({
  parent: form,
  mouse: true,
  keys: true,
  left: 2,
  top: 2,
  name: 'opcao1',
  content: 'Opção 1'
});

const radioSet2 = blessed.radiobutton({
  parent: form,
  mouse: true,
  keys: true,
  left: 2,
  top: 4,
  name: 'opcao2',
  content: 'Opção 2'
});

const radioSet3 = blessed.radiobutton({
  parent: form,
  mouse: true,
  keys: true,
  left: 2,
  top: 6,
  name: 'opcao3',
  content: 'Opção 3'
});

// Criar um botão para confirmar a seleção
const button = blessed.button({
  parent: form,
  mouse: true,
  keys: true,
  shrink: true,
  left: 'center',
  bottom: 2,
  name: 'submit',
  content: 'Selecionar',
  style: {
    bg: 'green',
    fg: 'white',
    focus: { bg: 'red' }
  }
});

// Criar uma área de saída para exibir a opção escolhida
const output = blessed.box({
  parent: screen,
  top: '80%',
  left: 'center',
  width: '50%',
  height: 'shrink',
  content: '',
  border: { type: 'line' },
  style: { border: { fg: 'cyan' } }
});

// Evento de clique no botão
button.on('press', () => {
  let selected = '';
  if (radioSet.checked) selected = 'Opção 1';
  if (radioSet2.checked) selected = 'Opção 2';
  if (radioSet3.checked) selected = 'Opção 3';

  output.setContent(`Opção selecionada: ${selected || 'Nenhuma'}`);
  screen.render();
});

// Permitir interações pelo teclado
screen.key(['q', 'C-c'], () => process.exit(0)); // Sair com "q" ou Ctrl+C
screen.render();




