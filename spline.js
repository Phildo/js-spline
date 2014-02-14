function Spline(params)
{
  var self = this;

  if(!params) params = {};

  if(params.hasOwnProperty('debug')) this.debug = params.debug; else this.debug = false;
  if(!(this.parentContainer = params.parentContainer))
  {
    this.parentContainer = document.createElement('div');
    this.parentContainer.width  = 100;
    this.parentContainer.height = 100;
  }
  if(params.hasOwnProperty('points'))     this.points     = params.points;     else this.points     = [{"x":-1,"y":1},{"x":-1,"y":-1},{"x":1,"y":-1}];
  if(params.hasOwnProperty('fps'))        this.fps        = params.fps;        else this.fps        = 60;
  if(params.hasOwnProperty('rate'))       this.rate       = params.rate;       else this.rate       = 0.001;
  if(params.hasOwnProperty('width'))      this.width      = params.width;      else this.width      = 0;
  if(params.hasOwnProperty('height'))     this.height     = params.height;     else this.height     = 0;
  if(params.hasOwnProperty('xlen'))       this.xlen       = params.xlen;       else this.xlen       = 0;
  if(params.hasOwnProperty('ylen'))       this.ylen       = params.ylen;       else this.ylen       = 0;
  if(params.hasOwnProperty('origin'))     this.origin     = params.origin;     else this.origin     = "center";
  if(params.hasOwnProperty('ptradius'))   this.ptradius   = params.ptradius;   else this.ptradius   = 3;
  if(params.hasOwnProperty('linewidth'))  this.linewidth  = params.linewidth;  else this.linewidth  = 2;
  if(params.hasOwnProperty('linecolors')) this.linecolors = params.linecolors; else this.linecolors = ["#000000","#44AA44","#4444AA","#AA4444"];
  if(params.hasOwnProperty('ptcolors'))   this.ptcolors   = params.ptcolors;   else this.ptcolors   = ["#000000","#44AA44","#4444AA","#AA4444"];
  if(params.hasOwnProperty('drawcolor'))  this.drawcolor  = params.drawcolor;  else this.drawcolor  = "#FF0000";
  if(params.hasOwnProperty('bgcolor'))    this.bgcolor    = params.bgcolor;    else this.bgcolor    = "#FFFFFF";
  if(params.hasOwnProperty('editable'))   this.editable   = params.editable;   else this.editable   = true;
  if(params.hasOwnProperty('timectrls'))  this.timectrls  = params.timectrls;  else this.timectrls  = true;
  if(params.hasOwnProperty('clearbtn'))   this.clearbtn   = params.clearbtn;   else this.clearbtn   = true;

  //Special cases of inferring certain defaults
  if(!this.xlen && !this.ylen)
  {
    if(!this.width)  this.width  = this.parentContainer.offsetWidth;  if(!this.width)  this.width  = this.parentContainer.width;
    if(!this.height) this.height = this.parentContainer.offsetHeight; if(!this.height) this.height = this.parentContainer.height;
    this.xlen = Math.floor(this.width/10);
    this.ylen = Math.floor(this.height/10);
  }
  if(!this.width && !this.height)
  {
    this.width  = this.xlen*10;
    this.height = this.ylen*10;
  }

  var t = 0;

  var ptToPix = function(pt)
  {
    return { "x":(self.width/2+(pt.x*(self.width/self.xlen)))+0.5, "y":(self.height/2-(pt.y*(self.height/self.ylen)))+0.5 }
  }
  var pixToPt = function(pix)
  {
    return { "x":(pix.x-self.width/2)/(self.width/self.xlen), "y":-(pix.y-self.height/2)/(self.height/self.ylen) }
  }
  var interpaPt = function(pta, ptb, t)
  {
    return { "x":pta.x+((ptb.x-pta.x)*t),"y":pta.y+((ptb.y-pta.y)*t) };
  }

  var draw = function()
  {
    var pixCoordA;
    var pixCoordB;

    self.displayCanvas.context.fillStyle = self.bgcolor;
    self.displayCanvas.context.strokeStyle = "#BBBBBB";
    self.displayCanvas.context.lineWidth = 1;

    //clear bg
    drawRect(0,0,self.width,self.height,self.displayCanvas);

    //draw grid
    for(var x = 0; x < self.xlen; x++) //vertical lines
    {
      pixCoordA = ptToPix({"x":x-(self.xlen/2),"y":0});
      drawLine(pixCoordA.x,0,pixCoordA.x,self.height,self.displayCanvas);
    }
    for(var y = 0; y < self.ylen; y++) //horizontal lines
    {
      pixCoordA = ptToPix({"x":0,"y":y-(self.ylen/2)});
      drawLine(0,pixCoordA.y,self.width,pixCoordA.y,self.displayCanvas);
    }

    //set context
    self.displayCanvas.context.fillStyle = self.ptcolors[0];
    self.displayCanvas.context.strokeStyle = self.linecolors[0];
    self.displayCanvas.context.lineWidth = self.linewidth;

    var oldPts;
    var newPts = self.points;;
    var pass = 0;
    while(newPts.length > 1)
    {
      //draw pts
      oldPts = newPts;
      for(var i = 0; i < oldPts.length; i++)
      {
        pixCoordA = ptToPix(oldPts[i]);
        drawPt(pixCoordA.x,pixCoordA.y,self.ptradius,self.displayCanvas);
      }

      //draw lines, calculate next pts
      newPts = [];
      for(var i = 0; i < oldPts.length-1; i++)
      {
        newPts[i] = interpaPt(oldPts[i],oldPts[i+1],t);
        pixCoordA = ptToPix(oldPts[i]);
        pixCoordB = ptToPix(oldPts[i+1]);
        drawLine(pixCoordA.x,pixCoordA.y,pixCoordB.x,pixCoordB.y,self.displayCanvas);
      }

      pass++;
      self.displayCanvas.context.fillStyle   = self.ptcolors[pass%self.ptcolors.length];
      self.displayCanvas.context.strokeStyle = self.linecolors[pass%self.linecolors.length];
    }

    //draw result pt
    pixCoordA = ptToPix(newPts[0]);
    drawPt(pixCoordA.x,pixCoordA.y,self.ptradius,self.displayCanvas);

    //draw pt on scratch canvas for persistance
    self.scratchCanvas.context.fillStyle = self.drawcolor;
    drawRect(pixCoordA.x,pixCoordA.y,1,1,self.scratchCanvas)
    blitCanvas(self.scratchCanvas,self.displayCanvas);

    //draw ctrls
    if(self.timectrls)
    {
      self.displayCanvas.context.save();
      self.displayCanvas.context.strokeStyle = "#666666";
      self.displayCanvas.context.lineWidth = 5;
      var otow = self.width/20;  //one twentieth of width
      var ofow = self.width/50; //one fiftieth of width
      //back
      drawLine(ofow,self.height-ofow-ofow,ofow+otow,self.height-ofow-ofow-ofow,self.displayCanvas);
      drawLine(ofow,self.height-ofow-ofow,ofow+otow,self.height-ofow,self.displayCanvas);
      //pause
      drawLine(otow+ofow+ofow+ofow,self.height-ofow-otow,otow+ofow+ofow+ofow,self.height-ofow,self.displayCanvas);
      drawLine(otow+ofow+ofow+otow,self.height-ofow-otow,otow+ofow+ofow+otow,self.height-ofow,self.displayCanvas);
      //play
      drawLine(otow+otow+otow+ofow+otow,self.height-ofow-ofow,otow+otow+otow+ofow,self.height-ofow-ofow-ofow,self.displayCanvas);
      drawLine(otow+otow+otow+ofow+otow,self.height-ofow-ofow,otow+otow+otow+ofow,self.height-ofow,self.displayCanvas);
      self.displayCanvas.context.restore();
    }
    if(self.clearbtn)
    {
      self.displayCanvas.context.save();
      self.displayCanvas.context.strokeStyle = "#666666";
      self.displayCanvas.context.lineWidth = 5;
      var otow = self.width/20;  //one twentieth of width
      var ofow = self.width/50; //one fiftieth of width
      drawLine(self.width-ofow-otow,self.height-ofow-otow,self.width-ofow,     self.height-ofow,self.displayCanvas);
      drawLine(self.width-ofow     ,self.height-ofow-otow,self.width-ofow-otow,self.height-ofow,self.displayCanvas);
      self.displayCanvas.context.restore();
    }
  }

  var ticker;
  this.tick = function()
  {
    draw();
    t+=self.rate;
    if(t > 1) { t = 0; self.scratchCanvas.context.clearRect(0, 0, self.width, self.height); }
  };

  this.play  = function(){ if(!ticker) { self.tick(); ticker = setInterval(self.tick,Math.round(1000/self.fps)); } };
  this.pause = function(){ if(ticker)  ticker = clearInterval(ticker); }

  //canvas helpers
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

  this.displayCanvas = document.createElement('canvas');
  this.displayCanvas.context = this.displayCanvas.getContext('2d');
  this.displayCanvas.width  = this.width;
  this.displayCanvas.height = this.height;
  this.displayCanvas.context.imageSmoothingEnabled = false;
  this.displayCanvas.context.webkitImageSmoothingEnabled = false;

  this.scratchCanvas = document.createElement('canvas');
  this.scratchCanvas.context = this.scratchCanvas.getContext('2d');
  this.scratchCanvas.width  = this.width;
  this.scratchCanvas.height = this.height;
  this.scratchCanvas.context.imageSmoothingEnabled = false;
  this.scratchCanvas.context.webkitImageSmoothingEnabled = false;

  this.parentContainer.appendChild(this.displayCanvas);

  //editing
  var ptDragging;
  function startDrag(evt)
  {
    var pt = pixToPt({"x":evt.offsetX,"y":evt.offsetY});
    for(var i = 0; i < self.points.length; i++)
      if(Math.sqrt(Math.pow(self.points[i].x-pt.x,2)+Math.pow(self.points[i].y-pt.y,2)) < (self.ptradius*self.xlen/self.width)*2)
        ptDragging = self.points[i];

    if(!ptDragging && self.clearbtn)
    {
      if(evt.offsetX > self.width-(self.width/10) && evt.offsetY > self.height-(self.width/10))
        self.scratchCanvas.context.clearRect(0, 0, self.width, self.height);
    }
    if(!ptDragging && self.timectrls)
    {
      //back
      if(evt.offsetX < (self.width/10) && evt.offsetY > self.height-(self.width/10))
      {
        t = 0;
        self.scratchCanvas.context.clearRect(0, 0, self.width, self.height);
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
    var pt = pixToPt({"x":evt.offsetX,"y":evt.offsetY});
    ptDragging.x = pt.x;
    ptDragging.y = pt.y;

    if(!ticker) draw();
  }
  if(this.editable)
  {
    self.displayCanvas.addEventListener('mousedown', startDrag, false);
    self.displayCanvas.addEventListener('mouseup',   stopDrag,  false);
    self.displayCanvas.addEventListener('mousemove', drag,      false);
  }


  this.play();
};

