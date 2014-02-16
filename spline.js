var Spline = function(pts) //Array of pts. Each nD pt takes the form of an n-length array. ex:[0,0] <- lol causes error in vim modeline
{
  var self = this;

  var interpAPt = function(pt1, pt2, t, ptr) {};
  var interpAPt2D = function(pt1, pt2, t, ptr)
  {
    ptr[0] = pt1[0]+((pt2[0]-pt1[0])*t);
    ptr[1] = pt1[1]+((pt2[1]-pt1[1])*t);

    return ptr;
  }
  var interpAPt3D = function(pt1, pt2, t, ptr)
  {
    ptr[0] = pt1[0]+((pt2[0]-pt1[0])*t);
    ptr[1] = pt1[1]+((pt2[1]-pt1[1])*t);
    ptr[2] = pt1[2]+((pt2[2]-pt1[2])*t);

    return ptr;
  }
  var interpAPt4D = function(pt1, pt2, t, ptr)
  {
    ptr[0] = pt1[0]+((pt2[0]-pt1[0])*t);
    ptr[1] = pt1[1]+((pt2[1]-pt1[1])*t);
    ptr[2] = pt1[2]+((pt2[2]-pt1[2])*t);
    ptr[3] = pt1[3]+((pt2[3]-pt1[3])*t);

    return ptr;
  }
  var interpAPt5D = function(pt1, pt2, t, ptr)
  {
    ptr[0] = pt1[0]+((pt2[0]-pt1[0])*t);
    ptr[1] = pt1[1]+((pt2[1]-pt1[1])*t);
    ptr[2] = pt1[2]+((pt2[2]-pt1[2])*t);
    ptr[3] = pt1[3]+((pt2[3]-pt1[3])*t);
    ptr[4] = pt1[4]+((pt2[4]-pt1[4])*t);

    return ptr;
  }

  //derived pts- allocate once and persist to limit memory allocations on subsequent queries
  self.t; //last calculated t
  self.derivedPts; //3D array- array of: all derived pts sets, set of pts, 'pt' AKA n-length array
  self.calculatedPt; //last calculated pt (identical to self.derivedPts[self.derivedPts.length-1][0]
  self.setPts = function(pts)
  {
    self.pts = pts;
    self.derivedPts = [self.pts]; 
    for(var i = 1; i < self.pts.length; i++)
    {
      self.derivedPts[i] = []; //allocate
      for(var j = 0; j <  self.pts.length-i; j++)
        self.derivedPts[i][j] = [];
    }

    //set interp algo based on dimension/length
    interpAPt = interpAPt2D; //Currently only supports 2D- will have a switch statement for ND
  }
  self.ptForT = function(t)
  {
    if(t == self.t) return self.calculatedPt; //no need to recalculate
    self.t = t;

    var pass = 1; //'pass 0' is the population of the unchanging base pts
    while(pass < self.pts.length)
    {
      for(var i = 0; i < self.derivedPts[pass-1].length-1; i++)
        interpAPt(self.derivedPts[pass-1][i],self.derivedPts[pass-1][i+1],t,self.derivedPts[pass][i]);
      pass++;
    }
    return (self.calculatedPt = self.derivedPts[self.derivedPts.length-1][0]);
  };

  self.setPts(pts);
};

