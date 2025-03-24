// ==UserScript==
// @name         CTD Range Indicator
// @namespace    https://github.com/dev-101010/CTD-Range-Indicator
// @version      0.1
// @description  Adds new range indicators for CTD
// @author       dev-101010
// @match        https://www.c-td.de/member/battlefield
// @icon         https://www.google.com/s2/favicons?sz=64&domain=c-td.de
// @require      https://raw.githubusercontent.com/dev-101010/CTD-Range-Indicator/refs/heads/main/rangeModul.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    //SOCKET START (from original script)

    const serverURI = "wss://ctd.drochmann.de:8125";

    let userData = null;

    const socket = io(serverURI, {
        reconnection: true,
        reconnectionDelayMax: 1000,
        reconnectionAttempts: 0,
        pingTimeout: 20000,
        pingInterval: 25000,

        auth: {
            authToken: authToken
        }
    });
    window.addEventListener('beforeunload', () => {
        socket.disconnect();
    });

    socket.on("connect", () => {
        socket.emit("authUser", {
            token: userToken
        });
        console.log("Connected");
    });
    socket.on("authSuccess", (data) => {
        console.log("Auth success");
    });

    socket.on("mapLoaded", (data) => {
        rangeModul.mapLoaded(data);
    });

    socket.on("updateUserDetails", (data) => {
        rangeModul.updateUserDetails(data);
    });

    socket.on("userTowerPlaced", (data) => {
        rangeModul.userTowerPlaced(data);
    });

    socket.on("towerMainValuesChanged", (data) => {
        rangeModul.towerMainValuesChanged(data);
    });

    socket.on("towerStatsValuesChanged", (data) => {
        rangeModul.towerStatsValuesChanged(data);
    });

    socket.on("userTowerBeforeMove", (data) => {
        rangeModul.userTowerBeforeMove(data);
    });

    socket.on("removeTower", (data) => {
        rangeModul.removeTower(data);
    });

    //SOCKEND END

    // ADD CANVAS START

    const gridContainer = document.getElementById("gridContainer");

    // Get the parent of the target element
    const parent = gridContainer.parentElement;

    // Wrapper-Div erstellen
    const wrapper = document.createElement("div");
    wrapper.style.position = "absolute";
    wrapper.style.top = "0";
    wrapper.style.left = "0";
    wrapper.style.right = "0";
    wrapper.style.bottom = "0";
    wrapper.style.padding = "16px";
    wrapper.style.pointerEvents = "none";
    wrapper.style.zIndex = "10";
    wrapper.style.boxSizing = "border-box";

    // Canvas erstellen
    const canvas = document.createElement("canvas");
    canvas.id = "rangeCanvas";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    canvas.style.pointerEvents = "none";

    canvas.width = 1000;
    canvas.height = 1000;

    // Canvas ins Wrapper-Div
    wrapper.appendChild(canvas);
    // Wrapper ins Parent
    parent.appendChild(wrapper);

    // ADD CANVAS END

    rangeModul.init(gridContainer, canvas);

})();
