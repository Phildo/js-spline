SplineDisplay = function(params)
{
  var self = this;

  //stateless helpers
  //ptmath
  var ptToPix = function(pt)  { return [ (self.width/2+(pt[0]*(self.width/self.xlen)))+0.5, (self.height/2-(pt[1]*(self.height/self.ylen)))+0.5 ]; }
  var pixToPt = function(pix) { return [ (pix[0]-self.width/2)/(self.width/self.xlen),      -(pix[1]-self.height/2)/(self.height/self.ylen)     ]; }

  //canvas manipulation
  function drawLine(ox,oy,dx,dy,canvas)
  {
    canvas.context.beginPath();
    canvas.context.moveTo(ox,oy);
    canvas.context.lineTo(dx,dy);
    canvas.context.stroke();
  }
  function drawPt(x,y,r,canvas)
  {
    canvas.context.beginPath();
    canvas.context.arc(x, y, r, 0, 2*Math.PI, false);
    canvas.context.fill();
    canvas.context.stroke();
  }
  function drawRect(x,y,w,h,canvas)
  {
    canvas.context.fillRect(x, y, w, h);
  }
  function blitCanvas(orig,dest)
  {
    dest.context.drawImage(orig, 0, 0, self.width, self.height, 0, 0, self.width, self.height);
  }
  function clearCanvas(canvas)
  {
    canvas.context.clearRect(0, 0, self.width, self.height);
  }

  //Handle param config
  if(!params) params = {};

  if(params.hasOwnProperty('debug')) self.debug = params.debug; else self.debug = false;
  if(!(self.parentContainer = params.parentContainer))
  {
    self.parentContainer = document.createElement('div');
    self.parentContainer.width  = 100;
    self.parentContainer.height = 100;
  }
  if(params.hasOwnProperty('spline'))     self.spline     = params.spline;     else self.spline     = new Spline([[-1,1],[-1,-1],[1,-1],[1,1]]);
  if(params.hasOwnProperty('splines'))    self.splines    = params.splines;    else self.splines    = [self.spline];
  if(params.hasOwnProperty('mode'))       self.mode       = params.mode;       else self.mode       = "sequential";
  if(params.hasOwnProperty('fps'))        self.fps        = params.fps;        else self.fps        = 60;
  if(params.hasOwnProperty('rate'))       self.rate       = params.rate;       else self.rate       = 0.01;
  if(params.hasOwnProperty('width'))      self.width      = params.width;      else self.width      = 0;
  if(params.hasOwnProperty('height'))     self.height     = params.height;     else self.height     = 0;
  if(params.hasOwnProperty('xlen'))       self.xlen       = params.xlen;       else self.xlen       = 0;
  if(params.hasOwnProperty('ylen'))       self.ylen       = params.ylen;       else self.ylen       = 0;
  if(params.hasOwnProperty('origin'))     self.origin     = params.origin;     else self.origin     = "center";
  if(params.hasOwnProperty('drawldepth')) self.drawldepth = params.drawldepth; else self.drawldepth = 9999;
  if(params.hasOwnProperty('drawpdepth')) self.drawpdepth = params.drawpdepth; else self.drawpdepth = 9999;
  if(params.hasOwnProperty('drawplot'))   self.drawplot   = params.drawplot;   else self.drawplot   = true;
  if(params.hasOwnProperty('ptradius'))   self.ptradius   = params.ptradius;   else self.ptradius   = 3;
  if(params.hasOwnProperty('linewidth'))  self.linewidth  = params.linewidth;  else self.linewidth  = 2;
  if(params.hasOwnProperty('linecolors')) self.linecolors = params.linecolors; else self.linecolors = ["#000000","#44AA44","#4444AA","#AA4444"];
  if(params.hasOwnProperty('ptcolors'))   self.ptcolors   = params.ptcolors;   else self.ptcolors   = ["#000000","#44AA44","#4444AA","#AA4444"];
  if(params.hasOwnProperty('drawcolor'))  self.drawcolor  = params.drawcolor;  else self.drawcolor  = "#FF0000";
  if(params.hasOwnProperty('bgcolor'))    self.bgcolor    = params.bgcolor;    else self.bgcolor    = "#FFFFFF";
  if(params.hasOwnProperty('editable'))   self.editable   = params.editable;   else self.editable   = true;
  if(params.hasOwnProperty('grid'))       self.grid       = params.grid;       else self.grid       = true;
  if(params.hasOwnProperty('updatecallback')) self.updatecallback = params.updatecallback; else self.updatecallback = function(){};
  if(params.hasOwnProperty('editcallback'))   self.editcallback   = params.editcallback;   else self.editcallback   = function(){};

  //catch splines and convert pts to pixels
  self.renderSplines = [];
  for(var i = 0; i < self.splines.length; i++)
  {
    var splinePixs = [];
    for(var j = 0; j < self.splines[i].pts.length; j++)
      splinePixs.push(ptToPix(self.splines[i].pts[j]));
    self.renderSplines.push(new Spline(splinePixs)); //the spline calculated in pixels, not points (so we don't have to constantly convert)
  }

  //Special cases of inferring certain defaults
  if(!self.xlen && !self.ylen)
  {
    if(!self.width)  self.width  = self.parentContainer.offsetWidth;  if(!self.width)  self.width  = self.parentContainer.width;
    if(!self.height) self.height = self.parentContainer.offsetHeight; if(!self.height) self.height = self.parentContainer.height;
    self.xlen = Math.floor(self.width/10);
    self.ylen = Math.floor(self.height/10);
  }
  if(!self.width && !self.height)
  {
    self.width  = self.xlen*10;
    self.height = self.ylen*10;
  }

  //Init canvases
  //added to the dom
  var displayCanvas = document.createElement('canvas');
  displayCanvas.context = displayCanvas.getContext('2d');
  displayCanvas.width  = self.width;
  displayCanvas.height = self.height;
  displayCanvas.context.imageSmoothingEnabled = false;
  displayCanvas.context.webkitImageSmoothingEnabled = false;

  //draws the grid
  var gridCanvas = document.createElement('canvas');
  gridCanvas.context = gridCanvas.getContext('2d');
  gridCanvas.width  = self.width;
  gridCanvas.height = self.height;
  gridCanvas.context.imageSmoothingEnabled = false;
  gridCanvas.context.webkitImageSmoothingEnabled = false;
  gridCanvas.context.lineWidth = self.linewidth;

  //draws the points/lines
  var skeletonCanvas = document.createElement('canvas');
  skeletonCanvas.context = skeletonCanvas.getContext('2d');
  skeletonCanvas.width  = self.width;
  skeletonCanvas.height = self.height;
  skeletonCanvas.context.imageSmoothingEnabled = false;
  skeletonCanvas.context.webkitImageSmoothingEnabled = false;
  skeletonCanvas.context.lineWidth = self.linewidth;

  //draws the spline curve
  var plotCanvas = document.createElement('canvas');
  plotCanvas.context = plotCanvas.getContext('2d');
  plotCanvas.width  = self.width;
  plotCanvas.height = self.height;
  plotCanvas.context.imageSmoothingEnabled = false;
  plotCanvas.context.webkitImageSmoothingEnabled = false;
  plotCanvas.context.lineWidth = 1;
  plotCanvas.context.strokeStyle = self.drawcolor;
  
  self.parentContainer.appendChild(displayCanvas);

  //draw static grid once
  if(self.grid)
  {
    gridCanvas.context.strokeStyle = "#BBBBBB";
    gridCanvas.context.lineWidth = 1;
    var pixCoord;
    var cellWidth = self.width/self.xlen;
    var cellHeight = self.height/self.ylen;
    var startX = self.xlen%2 == 0 ? 0 : cellWidth/2;
    var startY = self.ylen%2 == 0 ? 0 : cellHeight/2;
    for(var x = 0; x < self.xlen; x++) //vertical lines
      drawLine(startX+cellWidth*x,0,startX+cellWidth*x,self.height,gridCanvas);
    for(var y = 0; y < self.ylen; y++) //horizontal lines
      drawLine(0,startY+cellHeight*y,self.width,startY+cellHeight*y,gridCanvas);
  }

  var t = 0;
  var lastCalculatedPt = [];
  var currentSpline = 0;
  var update = function()
  {
    self.renderSplines[currentSpline].ptForT(t);
    self.splines[currentSpline].ptForT(t);//calculate it for real splines as well in case of external queries, and because its cheap 
    //need to copy by value
    lastCalculatedPt[0] = self.renderSplines[currentSpline].calculatedPt[0];
    lastCalculatedPt[1] = self.renderSplines[currentSpline].calculatedPt[1];

    self.updatecallback(self.splines[currentSpline],self.splines[currentSpline].calculatedPt);

    t+=self.rate;
    if(t == 1+self.rate)
    {
      t = 0;
      currentSpline = 0;
    }
    if(t > 1)
    {
      t -=1;
      currentSpline++; //don't do this with modulo- need to manually check anyways
      if(currentSpline == self.splines.length)
      {
        t = 1;
        currentSpline--;
      }
    }

    self.spline = self.splines[currentSpline]; //in case of external query
  }
  var lastDrawnPt = [];
  var draw = function()
  {
    if(lastCalculatedPt[0] == self.renderSplines[0].pts[0][0] && lastCalculatedPt[1] == self.renderSplines[0].pts[0][1]) //if last calculated pt is first pt
      lastDrawnPt = []; //prevent connection line
    clearCanvas(skeletonCanvas);

    for(var i = 0; i < self.renderSplines.length; i++)
    {
      var pass = 0;
      for(var j = 0; j < self.renderSplines[i].derivedPts.length; j++)
      {
        skeletonCanvas.context.fillStyle   = self.ptcolors[pass%self.ptcolors.length];
        skeletonCanvas.context.strokeStyle = self.linecolors[pass%self.linecolors.length];
        for(var k = 0; k < self.renderSplines[i].derivedPts[j].length; k++)
        {
          if(pass < self.drawpdepth)
            drawPt(self.renderSplines[i].derivedPts[j][k][0],self.renderSplines[i].derivedPts[j][k][1],self.ptradius,skeletonCanvas);
          if(pass < self.drawldepth)
          {
            if(k < self.renderSplines[i].derivedPts[j].length-1)
              drawLine(self.renderSplines[i].derivedPts[j][k][0],self.renderSplines[i].derivedPts[j][k][1],self.renderSplines[i].derivedPts[j][k+1][0],self.renderSplines[i].derivedPts[j][k+1][1],skeletonCanvas);
          }
        }
        pass++;
      }
    }

    //draw pt on scratch canvas
    if(lastDrawnPt.length == 0)
    {
      //need to copy by value
      lastDrawnPt[0] = lastCalculatedPt[0];
      lastDrawnPt[1] = lastCalculatedPt[1];
    }
    if(self.drawplot)
      drawLine(lastDrawnPt[0],lastDrawnPt[1],lastCalculatedPt[0],lastCalculatedPt[1],plotCanvas);
    //need to copy by value
    lastDrawnPt[0] = lastCalculatedPt[0];
    lastDrawnPt[1] = lastCalculatedPt[1];

    //actually draw to display
    displayCanvas.context.fillStyle = self.bgcolor;
    drawRect(0,0,self.width,self.height,displayCanvas);
    if(self.grid) blitCanvas(gridCanvas,displayCanvas);
    blitCanvas(skeletonCanvas,displayCanvas);
    blitCanvas(plotCanvas,displayCanvas);
  }

  var ticker;
  var tick = function()
  {
    update();
    draw();
  };

  self.play  = function(){ if(!ticker) { tick(); ticker = setInterval(tick,Math.round(1000/self.fps)); } };
  self.pause = function(){ if(ticker)  ticker = clearInterval(ticker); }

  function addOffsetToEvt(evt)
  {
    if(evt.offsetX != undefined) return;

    evt.offsetX = evt.layerX-evt.originalTarget.offsetLeft;
    evt.offsetY = evt.layerY-evt.originalTarget.offsetTop;
  }

  //editing
  var splineBeingDragged = -1;
  var ptBeingDragged = -1;
  function startDrag(evt)
  {
    addOffsetToEvt(evt);
    
    for(var i = 0; i < self.renderSplines.length; i++)
    {
      for(var j = 0; j < self.renderSplines[i].pts.length; j++)
      {
        if(Math.sqrt(Math.pow(self.renderSplines[i].pts[j][0]-evt.offsetX,2)+Math.pow(self.renderSplines[i].pts[j][1]-evt.offsetY,2)) < self.ptradius+5)
        {
          splineBeingDragged = i;
          ptBeingDragged = j;
        }
      }
    }
  }
  function stopDrag()
  {
    splineBeingDragged = -1;
    ptBeingDragged = -1;
  }
  function drag(evt)
  {
    addOffsetToEvt(evt);

    if(splineBeingDragged == -1 || ptBeingDragged == -1) return;

    //alter regular spline as well, to keep in sync
    var newPt = pixToPt([evt.offsetX, evt.offsetY]);
    self.splines[splineBeingDragged].pts[ptBeingDragged][0] = newPt[0];
    self.splines[splineBeingDragged].pts[ptBeingDragged][1] = newPt[1];
    
    self.renderSplines[splineBeingDragged].pts[ptBeingDragged][0] = evt.offsetX;
    self.renderSplines[splineBeingDragged].pts[ptBeingDragged][1] = evt.offsetY;

    clearCanvas(plotCanvas);
    lastCalculatedPt = []; //prevent connection line

    self.editcallback(self.spline);

    if(!ticker) { draw(); }
  }
  if(self.editable)
  {
    displayCanvas.addEventListener('mousedown', startDrag, false);
    displayCanvas.addEventListener('mouseup',   stopDrag,  false);
    displayCanvas.addEventListener('mousemove', drag,      false);
  }

  self.play();
};

