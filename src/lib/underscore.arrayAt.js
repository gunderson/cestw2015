if (_){
  _.mixin({
    "at": function(array, index){
      return array[Math.abs(index % array.length) >> 0];
    }
  });
}
