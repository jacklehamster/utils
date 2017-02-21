(function (global, factory) {
 	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
 	typeof define === 'function' && define.amd ? define(['exports'], factory) :
 	(factory((global.DOK = global.DOK || {})));
 }(this, (function (core) { 'use strict';
 
    /**
     *  FUNCTION DEFINITIONS
     */
   function logScript() {
       var currentScript = getCurrentScript();
       loadedScripts[currentScript.filename] = true;
       console.log(currentScript.filename);
   }
   
   function fixPath() {
       var regex = /\/$|index\.html$|next\.html$/g;
       if (!regex.exec(location.pathname)) {
           window.history.pushState(null,"", location.pathname+"/"+location.search+location.hash);
       }
   }

   function getCurrentScript() {
        var currentScript = document.currentScript.src;
        var regex = /[a-zA-Z-]*:\/\/[^/]+(\/([^/]+\/)+)(.+)/g;
        var match = regex.exec(currentScript);
        return {
            filename: match[3],
            path: match[1],
            src: match[0],
        };
   }
   
   function changeScene(scene, htmlFile) {
        if(typeof(htmlFile)=='undefined') {
            htmlFile = 'scene.html';
        }
        core.destroyEverything();
        location.replace("../" + scene + "/" + htmlFile);
   }
   
   function handleError(error, soft) {
        if(Array.isArray(error)) {
            var array = [];
            for(var i=0;i<error.length;i++) {
                array.push(error[i]);
                array.push("\n ");
            }
            console.error.apply(null, array);
        } else {
            console.error(error);
        }
        core.lastError = error;
        if(!soft) {
            throw new Error("Last error terminated the process.");
        }
   }
   
   function checkScriptLoaded(script) {
        var loaded = false;
        switch(script) {
            case 'threejs':
                loaded = window.THREE;
                break;
            case 'jsgif':
                loaded = window.parseGIF||window.Stream;
                break;
            case 'md5':
                loaded = window.md5;
                break;
            case 'mathjs':
                loaded = window.math;
                break;
            case 'stripJsonComments':
                loaded = window.stripJsonComments;
                break;
            default:
                loaded = loadedScripts[script];
        }
        if(!loaded) {
            core.handleError(["Unable to load " + getCurrentScript().filename, "Script required: " + script]);
        }
   }
   
   var loadedScripts = {};
   function requireScripts(scripts) {
        scripts.forEach(checkScriptLoaded);
   }
   
   function destroyEverything() {
        loadedScripts = {};
   }
   
   function combineMethods(firstMethod, secondMethod) {
        return function() {
            if(firstMethod)
                firstMethod();
            if(secondMethod)
                secondMethod();
        };
   }
   
   function expectParams(args) {
        assert(typeof(args) == 'object', "Pass 'arguments' to expectParams");
        
        for(var i=1; i<arguments.length; i++) {
            var type = args[i-1]===null? 'null' : Array.isArray(args[i-1])?'array' : typeof(args[i-1]);
            assert(
                arguments[i].split("|").indexOf(type)>=0,
                ["Expected argument "+(i-1)+" to be "+arguments[i]+" NOT "+type, args]
            );
        }
   }
   
   function assert(condition, message) {
        if(!condition) {
            handleError(message ? message: "Assert failed: condition not met.");
        }
   }
   
   function setupExit() {
        window.addEventListener("beforeunload", function (e) {
            core.destroyEverything();
        });
   }
   
    /**
     *  PUBLIC DECLARATIONS
     */
   core.getCurrentScript = getCurrentScript;
   core.logScript = logScript;
   core.handleError = handleError;
   core.requireScripts = requireScripts;
   core.changeScene = changeScene;
   core.destroyEverything = destroyEverything;
   core.combineMethods = combineMethods;
   core.expectParams = expectParams;
   core.assert = assert;

   
   /**
    *   PROCESSES
    */
    fixPath();
    core.logScript();
    setupExit();
 })));
