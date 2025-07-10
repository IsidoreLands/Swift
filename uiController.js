// This module will handle interactions with the HTML UI.

function onLaunch() {
    console.log("Launch sequence initiated! The uiController is successfully connected.");
    // In future iterations, this will call the launch sequence from rocket.js
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
