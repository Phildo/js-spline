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
  if(params.hasOwnProperty('fps'))        self.fps        = params.fps;        else self.fps        = 60;
  if(params.hasOwnProperty('rate'))       self.rate       = params.rate;       else self.rate       = 0.01;
  if(params.hasOwnProperty('width'))      self.width      = params.width;      else self.width      = 0;
  if(params.hasOwnProperty('height'))     self.height     = params.height;     else self.height     = 0;
  if(params.hasOwnProperty('xlen'))       self.xlen       = params.xlen;       else self.xlen       = 0;
  if(params.hasOwnProperty('ylen'))       self.ylen       = params.ylen;       else self.ylen       = 0;
  if(params.hasOwnProperty('origin'))     self.origin     = params.origin;     else self.origin     = "center";
  if(params.hasOwnProperty('ptradius'))   self.ptradius   = params.ptradius;   else self.ptradius   = 3;
  if(params.hasOwnProperty('linewidth'))  self.linewidth  = params.linewidth;  else self.linewidth  = 2;
  if(params.hasOwnProperty('linecolors')) self.linecolors = params.linecolors; else self.linecolors = ["#000000","#44AA44","#4444AA","#AA4444"];
  if(params.hasOwnProperty('ptcolors'))   self.ptcolors   = params.ptcolors;   else self.ptcolors   = ["#000000","#44AA44","#4444AA","#AA4444"];
  if(params.hasOwnProperty('drawcolor'))  self.drawcolor  = params.drawcolor;  else self.drawcolor  = "#FF0000";
  if(params.hasOwnProperty('bgcolor'))    self.bgcolor    = params.bgcolor;    else self.bgcolor    = "#FFFFFF";
  if(params.hasOwnProperty('editable'))   self.editable   = params.editable;   else self.editable   = true;
  if(params.hasOwnProperty('ctrls'))      self.ctrls      = params.ctrls;      else self.ctrls      = true;
  if(params.hasOwnProperty('grid'))       self.grid       = params.grid;       else self.grid       = true;

  //catch spline and convert pts to pixels
  var splinePixs = [];
  for(var i = 0; i < self.spline.pts.length; i++)
    splinePixs.push(ptToPix(self.spline.pts[i]));
  self.spline.setPts(splinePixs);

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

  //draws the points/lines
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

  //draws the grid/controls
  var hudCanvas = document.createElement('canvas');
  hudCanvas.context = hudCanvas.getContext('2d');
  hudCanvas.width  = self.width;
  hudCanvas.height = self.height;
  hudCanvas.context.imageSmoothingEnabled = false;
  
  self.parentContainer.appendChild(displayCanvas);

  //draw static hud once
  if(self.grid)
  {
    gridCanvas.context.strokeStyle = "#BBBBBB";
    gridCanvas.context.lineWidth = 1;
    var pixCoord;
    for(var x = 0; x < self.xlen; x++) //vertical lines
      drawLine(self.width/self.xlen*x,0,self.width/self.xlen*x,self.height,gridCanvas);
    for(var y = 0; y < self.ylen; y++) //horizontal lines
      drawLine(0,self.height/self.ylen*y,self.width,self.height/self.ylen*y,gridCanvas);
  }
  if(self.ctrls)
  {
    hudCanvas.context.strokeStyle = "#666666";
    hudCanvas.context.lineWidth = 5;
    var otow = self.width/20; //one twentieth of width
    var ofow = self.width/50; //one fiftieth of width
    //back
    drawLine(ofow,self.height-ofow-ofow,ofow+otow,self.height-ofow-ofow-ofow,hudCanvas);
    drawLine(ofow,self.height-ofow-ofow,ofow+otow,self.height-ofow,hudCanvas);
    //pause
    drawLine(otow+ofow+ofow+ofow,self.height-ofow-otow,otow+ofow+ofow+ofow,self.height-ofow,hudCanvas);
    drawLine(otow+ofow+ofow+otow,self.height-ofow-otow,otow+ofow+ofow+otow,self.height-ofow,hudCanvas);
    //play
    drawLine(otow+otow+otow+ofow+otow,self.height-ofow-ofow,otow+otow+otow+ofow,self.height-ofow-ofow-ofow,hudCanvas);
    drawLine(otow+otow+otow+ofow+otow,self.height-ofow-ofow,otow+otow+otow+ofow,self.height-ofow,hudCanvas);
    //clear btn
    drawLine(self.width-ofow-otow,self.height-ofow-otow,self.width-ofow,     self.height-ofow,hudCanvas);
    drawLine(self.width-ofow     ,self.height-ofow-otow,self.width-ofow-otow,self.height-ofow,hudCanvas);
  }

  var t = 0;
  var lastCalculatedPt = [];
  var update = function()
  {
    t+=self.rate;
    if(t > 1) 
    {
      lastDrawnPt = []; //prevent connection line
      t = 0;
    }
    self.spline.ptForT(t);
    //need to copy by value
    lastCalculatedPt[0] = self.spline.calculatedPt[0];
    lastCalculatedPt[1] = self.spline.calculatedPt[1];
  }
  var lastDrawnPt = [];
  var draw = function()
  {
    clearCanvas(skeletonCanvas);
    var pass = 0;
    for(var i = 0; i < self.spline.derivedPts.length; i++)
    {
      skeletonCanvas.context.fillStyle   = self.ptcolors[pass%self.ptcolors.length];
      skeletonCanvas.context.strokeStyle = self.linecolors[pass%self.linecolors.length];
      for(var j = 0; j < self.spline.derivedPts[i].length; j++)
      {
        drawPt(self.spline.derivedPts[i][j][0],self.spline.derivedPts[i][j][1],self.ptradius,skeletonCanvas);
        if(j < self.spline.derivedPts[i].length-1)
          drawLine(self.spline.derivedPts[i][j][0],self.spline.derivedPts[i][j][1],self.spline.derivedPts[i][j+1][0],self.spline.derivedPts[i][j+1][1],skeletonCanvas);
      }
      pass++;
    }

    //draw pt on scratch canvas
    if(!lastDrawnPt)
    {
      //need to copy by value
      lastDrawnPt[0] = lastCalculatedPt[0];
      lastDrawnPt[1] = lastCalculatedPt[1];
    }
    //Only draw line if distance isn't huge
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
    if(self.ctrls) blitCanvas(hudCanvas,displayCanvas);
  }

  var ticker;
  var tick = function()
  {
    update();
    draw();
  };

  self.play  = function(){ if(!ticker) { tick(); ticker = setInterval(tick,Math.round(1000/self.fps)); } };
  self.pause = function(){ if(ticker)  ticker = clearInterval(ticker); }

  //editing
  var ptDragging;
  function startDrag(evt)
  {
    for(var i = 0; i < self.spline.pts.length; i++)
    {
      if(Math.sqrt(Math.pow(self.spline.pts[i][0]-evt.offsetX,2)+Math.pow(self.spline.pts[i][1]-evt.offsetY,2)) < self.ptradius+5)
        ptDragging = self.spline.pts[i];
    }

    if(!ptDragging && self.ctrls)
    {
      //clear
      if(evt.offsetX > self.width-(self.width/10) && evt.offsetY > self.height-(self.width/10))
      {
        plotCanvas.context.clearRect(0, 0, self.width, self.height);
        draw();
      }
      //back
      if(evt.offsetX < (self.width/10) && evt.offsetY > self.height-(self.width/10))
      {
        t = 0; 
        lastDrawnPt = []; //prevent connection line
        draw();
      }
      //pause
      else if(evt.offsetX < (self.width/6) && evt.offsetY > self.height-(self.width/10))
        self.pause();
      //play
      else if(evt.offsetX < (self.width/2) && evt.offsetY > self.height-(self.width/10))
        self.play();
    }
  }
  function stopDrag()
  {
    ptDragging = false;
  }
  function drag(evt)
  {
    if(!ptDragging) return;
    ptDragging[0] = evt.offsetX;
    ptDragging[1] = evt.offsetY;

    if(!ticker) { update(); draw(); }
  }
  if(self.editable)
  {
    displayCanvas.addEventListener('mousedown', startDrag, false);
    displayCanvas.addEventListener('mouseup',   stopDrag,  false);
    displayCanvas.addEventListener('mousemove', drag,      false);
  }

  self.play();
};

