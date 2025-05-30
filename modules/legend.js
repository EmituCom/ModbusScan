const blessed = require('blessed');

function createLegend(screen) {
    return blessed.text({
        parent: screen,
        bottom: 0,
        left: 'center',
        width: '70%',
        height: 'shrink',
        content: ' {black-fg}{white-bg} F1 Help {/} {black-fg}{white-bg} F2 Create {/} {black-fg}{white-bg} F3 Filter {/} {black-fg}{white-bg} F4 Search {/} {black-fg}{white-bg} F5 Clear {/} {black-fg}{white-bg} F6 New Read {/} {black-fg}{white-bg} F10 Quit {/}',
        style: { fg: 'black', bg: 'light-grey' },
        tags: true
    });
}

module.exports = createLegend;