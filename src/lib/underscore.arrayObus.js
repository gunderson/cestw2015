if (_){
  _.mixin({
    "obus": function(array, index){
      return array.slice(index).concat(array.slice(0,index));
    }
  });
}
