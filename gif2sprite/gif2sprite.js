
function handleFiles(e) {
  var reader = new FileReader;
  reader.onload = function(event) {
    var img = document.getElementById('image1');
    img.src = event.target.result;
  }
  reader.readAsDataURL(e.target.files[0]);
}

function calculateBestSize(width, height, count) {
  var bestcols = 1,
    bestratio = Number.MAX_VALUE;
  for (var cols = 1; cols <= count; cols++) {
    var w = cols * width;
    var h = Math.ceil(count / cols) * height;
    var ratio = w / h;
    if (Math.abs(ratio - 1) < bestratio) {
      bestratio = Math.abs(ratio - 1);
      bestcols = cols;
    }
  }
  return bestcols;
}

function magic(f, img) {
    var imagetype = document.getElementById('imagetype').value;
    var scale = parseFloat(document.getElementById('scale').value);
    if(isNaN(scale)) {
        scale = 1;
    }


  var canvas = document.createElement('canvas');
  var width = img.naturalWidth,
    height = img.naturalHeight;
  var cols = calculateBestSize(width, height, f.length);
  var rows = Math.ceil(f.length / cols);
  var finalColWidth = Math.round(width * scale);
  var finalRowWidth = Math.round(height * scale);
  canvas.width = cols * finalColWidth;
  canvas.height = rows * finalRowWidth;

  var ctx = canvas.getContext("2d");

  for (var i = 0; i < f.length; i++) {
    var c = i % cols;
    var r = Math.floor(i / cols);
    putImage(
      f[i],
      ctx,
      c * finalColWidth,
      r * finalRowWidth,
      finalColWidth,
      finalRowWidth,
      0, 0,
      width, height);
  }
  
  document.getElementById('info').innerHTML = 
    "Scale: " + scale*100 + "%\n" +
    "Sprite size: " + Math.round(img.naturalWidth*scale) + "x" + Math.round(img.naturalHeight*scale) + "\n" +
    "Image type: " + imagetype + "\n" +
    "Number of frames: " + f.length + "\n" +
    "Grid dimension: " + cols + "x" + rows + "\n" +
    "Full image size: " + canvas.width + "x" + canvas.height + "\n";

  setTimeout(function() {
    var url = canvas.toDataURL(imagetype);
    document.getElementById('result').src = url;
    var link = document.getElementById('link');
    link.href = url;
  }, 1000);
}

function putImage(src, ctx, x, y, w, h) {
  var img = new Image();
  img.onload = function() {
    ctx.drawImage(img, x, y, w, h);
  }
  img.src = src;
}

function sampleImg(img, banana) {
    var gif = DOK.createGif(img.src);
    gif.addEventListener("load", function(e) {
        var width = gif.naturalWidth, height = gif.naturalHeight;
        var cols = calculateBestSize(width, gif.naturalHeight, gif.frameCount);
        var rows = Math.ceil(gif.frameCount / cols);
        var scale = 1;
        var finalColWidth = Math.round(width * scale);
        var finalRowWidth = Math.round(height * scale);
        var canvas = document.createElement('canvas');
        canvas.width = cols * finalColWidth;
        canvas.height = rows * finalRowWidth;

        var ctx = canvas.getContext("2d");

        for (var i = 0; i < gif.frameCount; i++) {
            var c = i % cols;
            var r = Math.floor(i / cols);

            gif.putOnCanvas(
                ctx,
                0,0,
                finalColWidth,
                finalRowWidth,
                c * finalColWidth,
                r * finalRowWidth,
                finalColWidth,
                finalRowWidth,
                i,
                completedCallback
            );
        }

        var count = 0;
        function completedCallback() {
            count++;
            if(count>=gif.frameCount) {
                setTimeout(function() {
                    var imagetype = document.getElementById('imagetype').value;
                    var url = canvas.toDataURL(imagetype);
                    document.getElementById('result').src = url;
                    var link = document.getElementById('link');
                    link.href = url;
                }, 100);
            }
        }
//          console.log(size);
//            console.log(gif);
    });
}

function sampleImgDeprecated(img, banana) {
  var lastUpdate;
  var frames = {};
  var count = 0;
  var f = [];
  var canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  var ctx = canvas.getContext("2d");
  (function() {
    var i = window.setInterval(function() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      var url = canvas.toDataURL();
      if (!frames[url]) {
        lastUpdate = Date.now();
        count++;
        frames[url] = count;
        f.push(url);
        
        
      }
      
        var imagetype = document.getElementById('imagetype').value;
        var scale = parseFloat(document.getElementById('scale').value);
        if(isNaN(scale)) {
            scale = 1;
        }        
        document.getElementById('info').innerHTML = 
            "Scale: " + scale*100 + "%\n" +
            "Sprite size: " + Math.round(img.naturalWidth*scale) + "x" + Math.round(img.naturalHeight*scale) + "\n" +
            "Image type: " + imagetype + "\n" +
            "Number of frames: " + count + "\n" +
            Math.ceil(3-(Date.now() - lastUpdate)/1000)+" sec.";

      if (Date.now() - lastUpdate > 2000 || banana && Date.now() - lastUpdate>400) {
        clearInterval(i);
        magic(f, img);
      }
    }, 0);
  })();
}


document.addEventListener("DOMContentLoaded",
    function() {
        var input = document.getElementById('input');
        input.addEventListener('change', handleFiles);
        
        
        //var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        //document.getElementById('safari').style.display = isSafari?"none":"";
        
        var img = document.getElementById('image1');
        var banana = true;
        img.onload = function() {
          sampleImg(img, banana);
          banana = false;
        }
    }
);
