// ==UserScript==
// @name         CTD Range Indicator
// @namespace    https://github.com/dev-101010/CTD-Range-Indicator
// @version      0.1
// @description  Adds new range indicators for CTD
// @author       dev-101010
// @match        https://ctddev.shimly-dev.de/member/battlefield
// @icon         https://www.google.com/s2/favicons?sz=64&domain=c-td.de
// @require      https://raw.githubusercontent.com/dev-101010/CTD-Range-Indicator/main/rangeModul.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    //SOCKET START (from original script)

    const serverURI = "wss://ctd.drochmann.de:8225";

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
    socket.on("authSuccess", (data,act) => {
        console.log("Auth success");
    });

    socket.on("mapLoaded", (data,act) => {
        console.log("mapLoaded",data);
        window.rangeModul.mapLoaded(data);
        act();
    });

    socket.on("mapClosed", (data,act) => {
        console.log("mapClosed",data);
        window.rangeModul.mapClosed(data);
        act();
    });

    socket.on("updateUserDetails", (data,act) => {
        console.log("updateUserDetails",data);
        window.rangeModul.updateUserDetails(data);
        act();
    });

    socket.on("userTowerPlaced", (data,act) => {
        console.log("userTowerPlaced",data);
        window.rangeModul.userTowerPlaced(data);
        act();
    });

    socket.on("towerMainValuesChanged", (data,act) => {
        console.log("towerMainValuesChanged",data);
        window.rangeModul.towerMainValuesChanged(data);
        act();
    });

    socket.on("towerStatsValuesChanged", (data,act) => {
        console.log("towerStatsValuesChanged",data);
        window.rangeModul.towerStatsValuesChanged(data);
        act();
    });

    socket.on("userTowerBeforeMove", (data,act) => {
        console.log("userTowerBeforeMove",data);
        window.rangeModul.userTowerBeforeMove(data);
        act();
    });

    socket.on("removeTower", (data,act) => {
        console.log("removeTower",data);
        window.rangeModul.removeTower(data);
        act();
    });

    socket.on("possibleTowers", (data,act) => {
        console.log("possibleTowers",data);
        window.rangeModul.possibleTowers(data);
        act();
    });

    socket.on("userReservedTile", (data,act) => {
        console.log("userReservedTile",data);
        window.rangeModul.userReservedTile(data);
        act();
    });

    socket.on("tileAbandoned", (data,act) => {
        console.log("tileAbandoned",data);
        window.rangeModul.tileAbandoned(data);
        act();
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

    window.rangeModul.init(gridContainer, canvas);

})();
