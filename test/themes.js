'use strict';

const path = require('path');

const ThemeScanner = require('../src/platform/theme/theme-scanner');

const themeScanner = new ThemeScanner([path.join(path.dirname(__dirname), 'resources', 'themes')]);

async function testLoader() {
    let themes = await themeScanner.scanThemes();

    console.log(JSON.stringify(themes, null, 4));

    for (let nonce of Object.keys(themes)) {
        let styles = await themeScanner.readStyle(nonce);

        console.log(nonce, '=', JSON.stringify(styles));
    }
}

const test = testLoader();

test.then(() => {
    console.log('Tests completed');
});

test.catch((err) => {
    console.error(err);
})
