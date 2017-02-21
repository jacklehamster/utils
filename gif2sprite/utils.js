(function (global, factory) {
 	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
 	typeof define === 'function' && define.amd ? define(['exports'], factory) :
 	(factory((global.DOK = global.DOK || {})));
 }(this, (function (core) { 'use strict';
 
    var pixelProcessors = {};

    /**
     *  FUNCTION DEFINITIONS
     */
   function loadAsync(src, callback, binary, method, data) {
        var xhr = new XMLHttpRequest();
        xhr.overrideMimeType(binary ? "text/plain; charset=x-user-defined" : "text/plain; charset=UTF-8");
        xhr.open(method?method:"GET", src, true);
        xhr.addEventListener('load',
            function (e) {
              if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    callback(xhr.responseText);
                } else {
                    core.handleError(xhr.responseText);
                }
              }
            }
        );
        xhr.addEventListener('error',
            function (e) {
                core.handleError(e);
            }
        );
        xhr.send(data);
   }
   
   function parseDuration(dur) {
        var match = 
            /^(\d+(\.\d+)?)\s?(|(m(illi)?)?s(ec(onds?)?)?|m(in(utes?)?)?)$/g.exec(dur);
        if(!match) {
            return null;
        }
        var value = parseFloat(match[1]);
        switch(match[3]) {
            case 's': case 'sec': case 'second': case 'seconds':
                value *= 1000;
                break;
            case 'm': case 'min': case 'minute': case 'minutes':
                value *= 1000*60;
                break;
        }
        return value;
   }
   
   function closeEnough(value, goal, margin) {
        if(margin===undefined) margin = 0.001;
        return Math.abs(value-goal) < margin ? goal : value; 
   }
   
   function getPixelProcessor(id) {
        return pixelProcessors[id];
   }
   
   function processPixels(src, fun) {
        var tag = md5(fun.toString());
        pixelProcessors[tag] = fun;
        return src+"|"+tag;
   }
   
   function flatten(objects) {
        var array = [];
        for(var i=0; i<objects.length;i++) {
            if(Array.isArray(objects[i]) || objects[i].isGraphicModel) {
                array = array.concat(flatten(objects[i]));
            } else {
                array.push(objects[i]);
            }
        }
        return array;
   }
   
   function distance(pos1, pos2) {
        var dx = pos1.x-pos2.x;
        var dy = pos1.y-pos2.y;
        var dz = pos1.z-pos2.z;
        return Math.sqrt(dx*dx+dy*dy+dz*dz);
   }
   
   function definePrototypes() {
        if(typeof(String.prototype.trim) === "undefined")
        {
            String.prototype.trim = function() {
                return String(this).replace(/^\s+|\s+$/g, '');
            };
        }    
        if(typeof(Array.prototype.objectCount) === "undefined") {
            Object.defineProperty(Array.prototype, "objectCount", {
                enumerable: false,
                configurable: false,
                get: function () {
                    var count = 0;
                    this.forEach(
                        function(obj) {
                            if(obj.destroyed) {
                                return;
                            }
                            if(obj.objects && typeof obj.objects.objectCount !== 'undefined') {
                                count += obj.objects.objectCount;
                            } else {
                                count++;
                            }
                        }
                    );
                    return count;
                }
            });
        }
        
        if(typeof(Array.prototype.at) === 'undefined') {
            Array.prototype.at = function(index) {
                return this[index];
            };
        }
        
        if(typeof(Array.prototype.a) === 'undefined') {
            Array.prototype.a = function(x,y) {
                for(var i=0; i<this.length; i++) {
                    if(this[i].x===x && this[i].y===y) {
                        return this[i];
                    }
                }
                return null;
            };
        }
   }
   
    /**
     *  PUBLIC DECLARATIONS
     */
   core.loadAsync = loadAsync;
   core.parseDuration = parseDuration;
   core.closeEnough = closeEnough;
   core.processPixels = processPixels;
   core.getPixelProcessor = getPixelProcessor;
   core.flatten = flatten;
   core.distance = distance;
   
   /**
    *   PROCESSES
    */
    core.requireScripts(['setup.js', 'md5']);
    core.logScript();
    definePrototypes();

 })));
