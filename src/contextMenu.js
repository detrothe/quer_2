import {infoBox} from './index';

(function () {

    "use strict";

    //////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////
    //
    // H E L P E R    F U N C T I O N S
    //
    //////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////

    /**
     * Function to check if we clicked inside an element with a particular class
     * name.
     *
     * @param {Object} e The event
     * @param {String} className The class name to check against
     * @return {Boolean}
     */
    function clickInsideElement(e, className) {
        var el = e.srcElement || e.target;

        if (el.classList.contains(className)) {
            return el;
        } else {
            while (el = el.parentNode) {
                if (el.classList && el.classList.contains(className)) {
                    return el;
                }
            }
        }

        return false;
    }

    /**
     * Get's exact position of event.
     *
     * @param {Object} e The event passed in
     * @return {Object} Returns the x and y position
     */
    function getPosition(e) {
        let posx = 0;
        let posy = 0;

        //if (!e) var e = window.event;

        if (e.pageX || e.pageY) {
            posx = e.pageX;
            posy = e.pageY;
        } else if (e.clientX || e.clientY) {
            posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
            posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
        }

        return {
            x: posx,
            y: posy
        }
    }

    //////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////
    //
    // C O R E    F U N C T I O N S
    //
    //////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////

    /**
     * Variables.
     */
        //var contextMenuClassName = "context-menu";
        //var contextMenuItemClassName = "context-menu__item";
    const contextMenuLinkClassName = "context-menu__link";
    const contextMenuActive = "context-menu--active";

    const taskItemClassName = "tasks";
    let taskItemInContext;

    let clickCoords;
    let clickCoordsX;
    let clickCoordsY;

    const menu = document.querySelector("#context-menu");
    //var menuItems = menu.querySelectorAll(".context-menu__item");
    let menuState = 0;
    let menuWidth;
    let menuHeight;
    //var menuPosition;
    //var menuPositionX;
    //var menuPositionY;

    let windowWidth;
    let windowHeight;

    /**
     * Initialise our application's code.
     */
    function init() {
        contextListener();
        clickListener();
        keyupListener();
        resizeListener();
    }

    /**
     * Listens for contextmenu events.
     */
    function contextListener() {
        document.addEventListener("contextmenu", function (e) {
            taskItemInContext = clickInsideElement(e, taskItemClassName);

            console.log("taskItemInContext", taskItemInContext);

            if (taskItemInContext) {
                e.preventDefault();
                toggleMenuOn();
                positionMenu(e);
            } else {
                taskItemInContext = null;
                toggleMenuOff();
            }
        });
    }

    /**
     * Listens for click events.
     */
    function clickListener() {
        document.addEventListener("click", function (e) {
            const clickeElIsLink = clickInsideElement(e, contextMenuLinkClassName);

            if (clickeElIsLink) {
                e.preventDefault();
                menuItemListener(clickeElIsLink);
            } else {
                //console.log("clickListener", e.button, e.which);
                //let button = e.which || e.button;  // e.which ||
                if (e.button === 0) {   // linke Maustaste
                    toggleMenuOff();
                }
            }
        });
    }

    /**
     * Listens for keyup events.
     */
    function keyupListener() {
        console.log("keyupListener",keyupListener);

        window.onkeyup = function (e) {
            if (e.keyCode === 27) {   // ESC Taste
                toggleMenuOff();
            }
        }
    }

    /**
     * Window resize event listener
     */
    function resizeListener() {
        window.onresize = function (e) {
            toggleMenuOff();
        };
    }

    /**
     * Turns the custom context menu on.
     */
    function toggleMenuOn() {
        if (menuState !== 1) {
            menuState = 1;
            menu.classList.add(contextMenuActive);
        }
    }

    /**
     * Turns the custom context menu off.
     */
    function toggleMenuOff() {
        if (menuState !== 0) {
            menuState = 0;
            menu.classList.remove(contextMenuActive);
        }
    }

    /**
     * Positions the menu properly.
     *
     * @param {Object} e The event
     */
    function positionMenu(e) {

        clickCoords = getPosition(e);
        clickCoordsX = clickCoords.x;
        clickCoordsY = clickCoords.y;

        menuWidth = menu.offsetWidth + 4;
        menuHeight = menu.offsetHeight + 4;

        windowWidth = document.documentElement.clientWidth;   //window.innerWidth;
        windowHeight = document.documentElement.clientHeight; //window.innerHeight;
        /*
            if ( (windowWidth - clickCoordsX) < menuWidth ) {
              menu.style.left = windowWidth - menuWidth + "px";
            } else {
              //menu.style.left = clickCoordsX + "px";
              menu.style.left = e.pageX + "px";
            }
        */
        if ((e.pageX + menuWidth) > windowWidth) {
            menu.style.left = e.pageX - menuWidth + "px";
        } else {
            //menu.style.left = clickCoordsX + "px";
            menu.style.left = e.pageX + "px";
        }
        /*
            if ( (windowHeight - clickCoordsY) < menuHeight ) {
              menu.style.top = windowHeight - menuHeight + "px";
            } else {
              //menu.style.top = clickCoordsY + "px";
              menu.style.top = e.pageY + "px";
            }
         */
        //console.log("positionmenu", e.pageY, menuHeight, windowHeight);
        let str = `${e.pageY}, ${menuHeight}, ${windowHeight}`;
        infoBox.innerHTML += "<br>positionmenu, " + str;

        if ((e.pageY + menuHeight) > windowHeight) {
            menu.style.top = e.pageY - menuHeight + "px";
        } else {
            //menu.style.top = clickCoordsY + "px";
            menu.style.top = e.pageY + "px";
        }
    }

    /**
     * Dummy action function that logs an action when a menu item link is clicked
     *
     * @param {HTMLElement} link The link that was clicked
     */
    function menuItemListener(link) {
        console.log("Task ID - " + taskItemInContext.getAttribute("data-id") + ", Task action - " + link.getAttribute("data-action"));
        toggleMenuOff();
    }

    /**
     * Run the app.
     */
    init();

})();