if (_){
  //PSEUDO RANDOM GENERATOR
  var _m_ = 4294967296,
  	// a - 1 should be divisible by m's prime factors
  	_a_ = 1664525,
  	// c and m should be co-prime
  	_c_ = 1013904223;
  // Setting the seed
  var _z_ = 123456789;

  _.mixin({
    "randomSeed": function(seed){
      _z_ = seed;
      //warm up
      _.random();
      _.random();
      _.random();
      _.random();
      _.random();
      _.random();
      _.random();
      _.random();
      _.random();
      _.random();
      _.random();
      return _.random();;
    },
    "random": function (min,max) {

        //if no arguments are supplied, defaults to 0,1
        //if one argument is suppiled, assume it's a max, use 0,max
        //if two arguments are supplied use min,max
        max = max || min || 1;
        min = (max !== min) ? min || 0 : 0;
        var range = max - min;
    	_z_ = (_a_ * _z_ + _c_) % _m_;
    	return min + (range * _z_/_m_);
    }
  });
}
