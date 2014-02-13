function GameOfLife(params)
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
  if(params.hasOwnProperty('points'))   this.points   = params.points;   else this.points   = [{"x":-1,"y":-1},{"x":1,"y",1}];
  if(params.hasOwnProperty('width'))    this.width    = params.width;    else this.width    = 0;
  if(params.hasOwnProperty('height'))   this.height   = params.height;   else this.height   = 0;
  if(params.hasOwnProperty('xlen'))     this.xlen     = params.xlen;     else this.xlen     = 0;
  if(params.hasOwnProperty('ylen'))     this.ylen     = params.ylen;     else this.ylen     = 0;
  if(params.hasOwnProperty('xoff'))     this.xoff     = params.xoff;     else this.xoff     = 0;
  if(params.hasOwnProperty('yoff'))     this.yoff     = params.yoff;     else this.yoff     = 0;
  if(params.hasOwnProperty('color'))    this.color    = params.color;    else this.color    = "#000000";
  if(params.hasOwnProperty('bgcolor'))  this.bgcolor  = params.bgcolor;  else this.bgcolor  = "#FFFFFF";

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

  var draw = function()
  {
    self.canvas.context.fillStyle = self.bgcolor;
    self.canvas.context.fillRect(0, 0, self.width, self.height);

    self.canvas.context.fillStyle = self.color;
    self.canvas.context.fillRect(node.x*self.size+self.padding/2,node.y*self.size+self.padding/2,self.size-self.padding,self.size-self.padding);
  }

  this.tick = function()
  {
  };

  this.play  = function(){ if(!ticker) { self.tick(); ticker = setInterval(self.tick,Math.round(60000/self.speed)); } };
  this.pause = function(){ if(ticker)  ticker = clearInterval(ticker); }

  this.canvas = document.createElement('canvas');
  this.canvas.context = this.canvas.getContext('2d');
  this.canvas.width  = this.width;
  this.canvas.height = this.height;
  this.canvas.context.imageSmoothingEnabled = false;
  this.canvas.context.webkitImageSmoothingEnabled = false;
  this.parentContainer.appendChild(this.canvas);

  this.tick();//do one tick to get startingGrid on board
};

