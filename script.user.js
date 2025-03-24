// ==UserScript==
// @name         CTD Range Indicator
// @namespace    https://github.com/dev-101010/CTD-Range-Indicator
// @version      0.1
// @description  Adds new range indicators for CTD
// @author       dev-101010
// @match        https://www.c-td.de/member/battlefield
// @icon         https://www.google.com/s2/favicons?sz=64&domain=c-td.de
// @grant        none
// ==/UserScript==

import * as rangeModule from './rangeModule.js';

(function() {
    'use strict';

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
        rangeModule.mapLoaded(data);
    });

    socket.on("updateUserDetails", (data) => {
        rangeModule.updateUserDetails(data);
    });

    socket.on("userTowerPlaced", (data) => {
        rangeModule.userTowerPlaced(data);
    });

    socket.on("towerMainValuesChanged", (data) => {
        rangeModule.towerMainValuesChanged(data);
    });

    socket.on("towerStatsValuesChanged", (data) => {
        rangeModule.towerStatsValuesChanged(data);
    });

    socket.on("userTowerBeforeMove", (data) => {
        rangeModule.userTowerBeforeMove(data);
    });

    socket.on("removeTower", (data) => {
        rangeModule.removeTower(data);
    });

    const gridContainer = document.getElementById("gridContainer");
    const parent = gridContainer.parentElement;

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

    const canEl = document.createElement("canvas");
    canEl.id = "rangeCanvas";
    canEl.style.width = "100%";
    canEl.style.height = "100%";
    canEl.style.display = "block";
    canEl.style.pointerEvents = "none";
    canEl.width = 1000;
    canEl.height = 1000;

    wrapper.appendChild(canEl);
    parent.appendChild(wrapper);

    const canvas = document.getElementById('rangeCanvas');

    rangeModule.init(gridContainer, canvas);

})();
