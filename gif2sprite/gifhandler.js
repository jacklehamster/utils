(function (global, factory) {
 	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
 	typeof define === 'function' && define.amd ? define(['exports'], factory) :
 	(factory((global.DOK = global.DOK || {})));
 }(this, (function (core) { 'use strict';
    
    /**
     *  HEADER
     */   
    core.requireScripts([
        'setup.js',
        'utils.js',
        'jsgif',
    ]);
    core.logScript();

    var currentScript = core.getCurrentScript();
    var gifWorker;
    var gifWorkerCallbacks = {};
    
    
    /**
     *  FUNCTION DEFINITIONS
     */   
    function createGif(src) {
        var completeCallbacks = [];
        var sizeLoadedCallbacks = [];
        var frameReadyCallbacks = [];
        var frameRenderedCallbacks = [];
        var header;
        var frameInfos = [];
        var renderTime = 0;
        var currentFrame = 0;
        var totalAnimationTime = 0;
        
        var gifImage = {
            complete:false,
            addFrameReadyCallback: function(frameIndex, callback) {
                if(!frameReadyCallbacks[frameIndex]) {
                    frameReadyCallbacks[frameIndex] = [];
                }
                frameReadyCallbacks[frameIndex].push(callback);
            },
            addFrameRenderedCallback: function(frameIndex, callback) {
                if(!frameRenderedCallbacks[frameIndex]) {
                    frameRenderedCallbacks[frameIndex] = [];
                }
                frameRenderedCallbacks[frameIndex].push(callback);
            },
            addEventListener:function(type, callback) {
                if(type=="load") {
                    completeCallbacks.push(callback);
                } else if(type=="sizeLoaded") {
                    sizeLoadedCallbacks.push(callback);
                }
            },
            removeEventListener:function(type, callback) {
                var array = type=="load" ? completeCallbacks : type=="sizeLoaded" ? sizeLoadedCallbacks : null;
                if(array) {
                    var index = array.indexOf(callback);
                    array.splice(index,1);
                }
            },
            naturalWidth: 0,
            naturalHeight: 0,
            multiFrame: true,
            getFrame: function() {
                if(!gifImage.complete) return 0;
                if(core.time > renderTime) {
                    currentFrame = (currentFrame+1) % frameInfos.length;
                    var totalAnimationTime = frameInfos[frameInfos.length-1].cycleTime;
                    renderTime = Math.floor(core.time / totalAnimationTime) * totalAnimationTime + frameInfos[currentFrame].cycleTime;
                }
                return currentFrame;
            },
            putOnCanvas: function(
                    ctx, 
                    srcX, srcY, srcWidth, srcHeight, 
                    destX, destY, destWidth, destHeight,
                    frameIndex,
                    completedCallback
                    ) {
                console.log(srcWidth, destWidth, srcHeight, destHeight);
                core.assert(srcWidth==destWidth && srcHeight==destHeight, "source and dest must match dimensions");
                
                if(frameIndex===0 || frameInfos[frameIndex-1].renderPosition) {
                    plasterPixels(
                        srcX,srcY,srcWidth,srcHeight,
                        destX,destY,destWidth,destHeight,
                        frameIndex
                    );
                } else {
                    gifImage.addFrameRenderedCallback(frameIndex-1,
                        function() {
                            plasterPixels(
                                srcX,srcY,srcWidth,srcHeight,
                                destX,destY,destWidth,destHeight,
                                frameIndex
                            );
                        }
                    );
                }
                
                
                function plasterPixels(
                        srcX, srcY, srcWidth, srcHeight,
                        destX, destY, destWidth, destHeight,
                        frameIndex) {
                        
                     if(frameIndex>0) { //  copy previous frame. That's how gifs work
                        var previousFramePosition = frameInfos[frameIndex-1].renderPosition;
                        var cData = previousFramePosition.context.getImageData(
                            previousFramePosition.x,
                            previousFramePosition.y,
                            previousFramePosition.width,
                            previousFramePosition.height
                        );
                        ctx.putImageData(cData, destX, destY);
                     }
                     
                     var frameInfo = frameInfos[frameIndex];
                     var img = frameInfo.img;
                     var cData = ctx.getImageData(destX + img.leftPos, destY + img.topPos, img.width, img.height);
                     var ct = img.lctFlag ? img.lct : header.gct;
                     
                     sendToGifWorker(
                         frameInfo, cData,
                         header,
                         function(cData) {
                            ctx.putImageData(cData, destX + img.leftPos, destY + img.topPos);            
                            frameInfos[frameIndex].renderPosition = {
                                context: ctx,
                                x: destX,
                                y: destY,
                                width: destWidth,
                                height: destHeight,
                            };
                            if(frameRenderedCallbacks[frameIndex]) {
                                frameRenderedCallbacks[frameIndex].forEach(
                                   function(callback) { callback.call(); }
                                );
                            }
                            completedCallback();
                         }
                     );
                }
            },
            isFrameLoaded: function(frameIndex) {
                return frameInfos[frameIndex] && frameInfos[frameIndex].img && frameInfos[frameIndex].gce;
            },
            get frameCount() {
                return frameInfos.length;
            },
        };
        
        function checkComplete(frameIndex) {
            if(gifImage.isFrameLoaded(frameIndex) && frameReadyCallbacks[frameIndex]) {
                frameReadyCallbacks[frameIndex].forEach(
                   function(callback) { callback.call(); }
                );
            }
        }
        
        var handler = {
          hdr: function (hdr) {
            header = hdr;
            gifImage.naturalWidth = header.width;
            gifImage.naturalHeight = header.height;
            sizeLoadedCallbacks.forEach(
                function(callback) { callback.call(); }
            );
          },
          gce: function (gce) {
              console.log(gce);
            if(frameInfos.length==0 || frameInfos[frameInfos.length-1].gce) {
                frameInfos.push({});            
            }
            var currentIndex = frameInfos.length-1;
            frameInfos[currentIndex].gce = gce;
            if(!gce.delayTime) {
                gce.delayTime = 1;
            }
            frameInfos[currentIndex].cycleTime = gce.delayTime * 10
                + (currentIndex === 0 ? 0 : frameInfos[currentIndex-1].cycleTime);
            checkComplete(frameInfos.length-1);
          },
          img: function(img) {
            if(frameInfos.length==0 || frameInfos[frameInfos.length-1].img) {
                frameInfos.push({});            
            }
            frameInfos[frameInfos.length-1].img = img;
            checkComplete(frameInfos.length-1);
          },
          eof: function(block) {
            gifImage.complete = true;
            completeCallbacks.forEach(
                function(callback) { callback.call(); }
            );
            console.log(frameInfos);
          }
        };
        
        core.loadAsync(src, 
            function(content) {
                var stream = new Stream(content);
                parseGIF(stream, handler);
            },
            true
        );
        return gifImage;
    }
    
    function initializeGifWorker() {
        gifWorker = new Worker(currentScript.path + "workers/gifworker.js");
        gifWorker.onmessage = function(e) {
           gifWorkerCallbacks[e.data.id] (e.data.response);
           delete gifWorkerCallbacks[e.data.id];
        }
    }
    
    function sendToGifWorker(frameInfo, cData, header, callback) {
        if(!gifWorker) {
            initializeGifWorker();
        }
        var id = md5(Math.random()+""+core.time);
        gifWorkerCallbacks[id] = callback;
        gifWorker.postMessage({
            frameInfo: frameInfo,
            cData: cData,
            header: header,
            id: id
        });
    }
                 
    function destroyEverything() {
        if(gifWorker) {
            gifWorker.terminate();
        }
        gifWorker = null;
        gifWorkerCallbacks = null;
    }
   
    /**
     *  PUBLIC DECLARATIONS
     */
    core.createGif = createGif;
    core.destroyEverything = core.combineMethods(destroyEverything, core.destroyEverything);

    /**
     *   PROCESSES
     */
     
     
 })));