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
  if(params.hasOwnProperty('points'))    this.points    = params.points;    else this.points    = [{"x":-1,"y":1},{"x":-1,"y":-1},{"x":1,"y":-1}];
  if(params.hasOwnProperty('width'))     this.width     = params.width;     else this.width     = 0;
  if(params.hasOwnProperty('height'))    this.height    = params.height;    else this.height    = 0;
  if(params.hasOwnProperty('xlen'))      this.xlen      = params.xlen;      else this.xlen      = 0;
  if(params.hasOwnProperty('ylen'))      this.ylen      = params.ylen;      else this.ylen      = 0;
  if(params.hasOwnProperty('origin'))    this.origin    = params.origin;    else this.origin    = "center";
  if(params.hasOwnProperty('ptradius'))  this.ptradius  = params.ptradius;  else this.ptradius  = 3;
  if(params.hasOwnProperty('ptcolor'))   this.ptcolor   = params.ptcolor;   else this.ptcolor   = "#000000";
  if(params.hasOwnProperty('linewidth')) this.linewidth = params.linewidth; else this.linewidth = 2;
  if(params.hasOwnProperty('linecolor')) this.linecolor = params.linecolor; else this.linecolor = "#000000";
  if(params.hasOwnProperty('bgcolor'))   this.bgcolor   = params.bgcolor;   else this.bgcolor   = "#FFFFFF";

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
    self.displayCanvas.context.fillRect(0, 0, self.width, self.height);

    //draw grid
    for(var x = 0; x < self.xlen; x++) //vertical lines
    {
      pixCoordA = ptToPix({"x":x-(self.xlen/2),"y":0});
      self.displayCanvas.context.beginPath();
      self.displayCanvas.context.moveTo(pixCoordA.x, 0);
      self.displayCanvas.context.lineTo(pixCoordA.x, self.height);
      self.displayCanvas.context.stroke();
    }
    for(var y = 0; y < self.ylen; y++) //horizontal lines
    {
      pixCoordA = ptToPix({"x":0,"y":y-(self.ylen/2)});
      self.displayCanvas.context.beginPath();
      self.displayCanvas.context.moveTo(0,          pixCoordA.y);
      self.displayCanvas.context.lineTo(self.width, pixCoordA.y);
      self.displayCanvas.context.stroke();
    }

    //set context
    self.displayCanvas.context.fillStyle = self.ptcolor;
    self.displayCanvas.context.strokeStyle = self.linecolor;
    self.displayCanvas.context.lineWidth = self.linewidth;

    var oldPts;
    var newPts = self.points;;
    while(newPts.length > 1)
    {
      //draw pts
      oldPts = newPts;
      for(var i = 0; i < oldPts.length; i++)
      {
        pixCoordA = ptToPix(oldPts[i]);
        self.displayCanvas.context.beginPath();
        self.displayCanvas.context.arc(pixCoordA.x, pixCoordA.y, self.ptradius, 0, 2*Math.PI, false);
        self.displayCanvas.context.fill();
        self.displayCanvas.context.stroke();
      }

      //draw lines, calculate next pts
      newPts = [];
      for(var i = 0; i < oldPts.length-1; i++)
      {
        newPts[i] = interpaPt(oldPts[i],oldPts[i+1],t);
        pixCoordA = ptToPix(oldPts[i]);
        pixCoordB = ptToPix(oldPts[i+1]);
        self.displayCanvas.context.beginPath();
        self.displayCanvas.context.moveTo(pixCoordA.x, pixCoordA.y);
        self.displayCanvas.context.lineTo(pixCoordB.x, pixCoordB.y);
        self.displayCanvas.context.stroke();
      }
    }

    //draw result pt
    pixCoordA = ptToPix(newPts[0]);
    self.displayCanvas.context.beginPath();
    self.displayCanvas.context.arc(pixCoordA.x, pixCoordA.y, self.ptradius, 0, 2*Math.PI, false);
    self.displayCanvas.context.fill();
    self.displayCanvas.context.stroke();

    //draw pt on scratch canvas for persistance
    self.scratchCanvas.context.fillRect(pixCoordA.x, pixCoordA.y, 1, 1);
    self.displayCanvas.context.drawImage(self.scratchCanvas, 0, 0, self.width, self.height, 0, 0, self.width, self.height);
  }

  this.tick = function()
  {
    draw();
    t+=0.005;
    if(t > 1) { t = 0; self.scratchCanvas.context.clearRect(0, 0, self.width, self.height); }
    setTimeout(self.tick,1);
  };

  this.play  = function(){ if(!ticker) { self.tick(); ticker = setInterval(self.tick,Math.round(60000/self.speed)); } };
  this.pause = function(){ if(ticker)  ticker = clearInterval(ticker); }

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

  this.tick();//do one tick to get startingGrid on board
};

