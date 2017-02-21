onmessage = function(e) {
    var frameInfo = e.data.frameInfo;
    var cData = e.data.cData;
    var header = e.data.header;
    var id = e.data.id;

    if(frameInfo && cData && header) {
        plasterPixels(frameInfo, cData, header);
    }
    postMessage({id:id, response:cData});
}

function plasterPixels(
        frameInfo,
        cData,
        header
        ) {
    var img = frameInfo.img;
    var gce = frameInfo.gce;
    var transparency = gce.transparencyGiven ? gce.transparencyIndex : null;
    var disposalMethod = gce.disposalMethod;

    var ct = img.lctFlag ? img.lct : header.gct;
    
    img.pixels.forEach(function(pixel, i) {
        if (transparency !== pixel) { // This includes null, if no transparency was defined.
            cData.data[i * 4 + 0] = ct[pixel][0];
            cData.data[i * 4 + 1] = ct[pixel][1];
            cData.data[i * 4 + 2] = ct[pixel][2];
            cData.data[i * 4 + 3] = 255; // Opaque.
        } else if (disposalMethod === 2 || disposalMethod === 3) {
            cData.data[i * 4 + 3] = 0; // Transparent.
        }
    });
}