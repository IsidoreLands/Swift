import { launch as launchRocket } from './rocket.js';

// This function is called when the green button is clicked.
function onLaunch() {
    launchRocket();
}

function init() {
    const greenButton = document.getElementById('green-button');
    if (greenButton) {
        greenButton.addEventListener('click', onLaunch);
    } else {
        console.error("Launch button not found!");
    }

    // We can add listeners for the red button and audio controls here later.
}

export { init };
