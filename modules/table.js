
const blessed = require('blessed');

const tableHeader = [
    '{bold}SID{/bold}',
    '{bold}Register{/bold}',
    '{bold}function{/bold}',
    '{bold}type{/bold}',
    '{bold}value{/bold}',
    '{bold}arch{/bold}',
    '{bold}description{/bold}',
    '{bold}status{/bold}'
];

const columnWidths = [4, 8, 15, 12, 15, 10, 30, 15];

function createTable(screen) {
return blessed.listtable({
    parent: screen,
    top: 1,
    left: 0,
    width: '100%',
    height: screen.height - 3,
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
}

module.exports = { createTable, tableHeader, columnWidths };