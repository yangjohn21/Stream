//memo0, sempty,snode taken from lab
function memo0(f) {
    let r = { evaluated: false };
    return {
        get() {
          if (! r.evaluated) { r = { evaluated: true, v: f() } }
          return r.v;
        }
    };
}
// sempty: Stream<T>
const sempty = {
    isEmpty: () => true,
    toString: () => 'sempty',    
    map: f => sempty,
    filter: pred => sempty,
};
// snode<T>(head: T, tail: Memo<Stream<T>>): Stream<T>
function snode(head, tail) {
    return {
        isEmpty: () => false,
        head: () => head,
        tail: tail.get,
        toString: () => "snode(" + head.toString() + ", " + tail.toString() + ")",
        map: f => snode(f(head), memo0(() => tail.get().map(f))),
        filter: pred => pred(head) ?
                  snode(head, memo0(() => tail.get().filter(pred)))
                : tail.get().filter(pred),
    }
}
//function returns 0 if the stream is empty at the given index
//f(number,Stream):number
function getValue(index,stream){
  if(stream.isEmpty()){
    return 0;
  }
  if(index===0){
    return stream.head();
  }
  return getValue(index-1,stream.tail());
}
//f(Stream, number):boolean
function emptyAtIndex(stream,index){
  if(stream.isEmpty()){
    return true;
  }
  if(index===0){
    return stream.isEmpty();
  }
  return emptyAtIndex(stream.tail(),index-1);
}
//adds the two series termwise,returns single stream
//f(Stream,Stream):Stream
function addSeries(s1,s2){
  if(s1.isEmpty()){
    return s2;
  } 
  if(s2.isEmpty()){
    return s1;
  }
  return snode(s1.head()+s2.head(),memo0(()=>addSeries(s1.tail(),s2.tail())));
}
//helper method to make sure that the prodIsNotEmpty, if it is empty, prodSeries will end the series
function prodIsNotEmpty(s1,s2,n){
  function getEmpty(s,index){
    if(index>=n+1){
      return index;
    }
    if(s.isEmpty()){
      return index;
    }
    return getEmpty(s.tail(),index+1);
  }
  let s1Empty = getEmpty(s1,0);
  let s2Empty = getEmpty(s2,0);
  return n <= (s1Empty-1)+(s2Empty-1); 
}
//returns the coef for a produce of two series
//f(Stream,Stream):Stream
function prodSeries(s1,s2){
  //n keeps track of the term of the polynomial
  function prodHelper(n){
    let coef = 0;
    if(prodIsNotEmpty(s1,s2,n)===false){
      
      return sempty;
    }    
    for(let i = n;i>=n/2;--i){
      coef+=(getValue(i,s1)*getValue(n-i,s2));      
      coef+=(getValue(i,s2)*getValue(n-i,s1));       
    }
      if(n%2===0){
        coef-=(getValue(n/2,s1)*getValue(n/2,s2));
      }    
    /*if(coef===0){
      return sempty;
    }*///somehow catch when this series will end
    return snode(coef,memo0(()=>prodHelper(n+1)));
  } 
   if(s1.isEmpty()){
    return sempty;
  } 
  if(s2.isEmpty()){
    return sempty;
  }
  return snode(s1.head() * s2.head(), memo0(()=>prodHelper(1)));
}
//returns a stream of the coef of the derivative of a polynomial
//f(Stream):Stream
function derivSeries(stream){
 if(stream.isEmpty()){
   return sempty;
 }
 function derivHelper(s,n){
   if(emptyAtIndex(s,1)){
     return sempty;
   }
   return snode(getValue(1,s)*(n+1),memo0(()=>derivHelper(s.tail(),n+1)));
 }
 return derivHelper(stream,0);
}
//returns a Stream of the coef of a polynomial up to a value n
//f(Stream,number):Stream
function coeffS(s,n){
  if(s.isEmpty()){
    return sempty;    
  }
  if(n===0){
    return snode(s.head(),memo0(()=>sempty));
  }
  return snode(s.head(),memo0(()=>coeffS(s.tail(),n-1)));
}
//returns an array of the coef of a polynomial up to a value n
//f(Stream,number):number[]
function coeff(s,n){
  let stream = coeffS(s,n);
  let a = [];
  while(!stream.isEmpty()){
    a.push(stream.head());
    stream = stream.tail();
  }
  return a;
}
//f(Stream,number): (number)=>Stream
function evalSeries(stream,n){
  //helps sum up each term of the polynomial
  function sumPow(stream,degree,sum,x){
    if(stream.isEmpty()){      
      return sum;
    }
    sum+=(Math.pow(x,degree)*stream.head());    
    return sumPow(stream.tail(),degree+1,sum,x);
  }
  //this is the closure
  return function f(x){
    //trims down to the stream
    let coeffStream = coeffS(stream,n);    
    return sumPow(coeffStream,0,0,x);
  }
}
//makes a stream where s0 = v, s1 = f(s0),... sn = f(sn-1)
//f((number)=>number,number):Stream
function rec1Series(f,v){
  return snode(v,memo0(()=>rec1Series(f,f(v))));
}
//returns coef of taylor series of e^x, ie an = 1/n!
//f():Stream
function expSeries(){
  function f(acc,n){
    return snode(acc*(1/n),memo0(()=>f(acc*1/n,n+1)));
  }
  return snode(1,memo0(()=>f(1,1)));
  
}

//f(number[],number[]): Stream<numbers>
function recurSeries(coef,init){
  function f(n){
    let sum = 0;
   //easy way to handle n-k<0
    if(n-coef.length<0){
      return snode(init[n],memo0(()=>f(n+1)));;
    }
    //add coef[0]*init[n-k]+coef[1]*init[n-k+1]+...coef[k]init[n-k+(k-1)]
    //for determining value sum, only look up to init[n-1]
    for(let i = 0;i<coef.length;++i){      
      sum+=coef[i]*init[n-coef.length+i];
    }
    //sum is new value, memo0(()=>f(n+1))
    //adds on the new values to the init array for easy access
    init.push(sum);
    return snode(sum,memo0(()=>f(n+1)));
  }
  //
  return f(0);
}
//tests

//creates stream of n,n+2,n+4,n+6,
function getStream(n){
  return snode(n,memo0(()=>getStream(n+2)));
}
//n is incrementer, start is beginning value 
function getStreamPlusN(n,start){
  return snode(start,memo0(()=>getStreamPlusN(n,n+start)));
}
test("getStream",function(){
let s1 = getStream(2);
let s2 = getStream(1);
assert(s1.tail().tail().head()===6);
assert(s2.tail().tail().tail().head()===7);
});
test("getStreamPlusN",function(){
  let s1 = getStreamPlusN(4,1);
  assert(s1.head()===1);
  assert(s1.tail().head()===5);
  assert(s1.tail().tail().head()===9);
});
test("getValue", function(){
  let s1 = getStreamPlusN(2,0);
  assert(getValue(0,s1)===0);
  assert(getValue(2,s1)===4);
  let s2 = sempty;
  assert(getValue(0,s2)===0);
  assert(getValue(6,s2)===0);
});
test("addSeries",function(){
  let s1 = getStream(2);
  let s2 = getStream(1);
  let resultStream = addSeries(s1,s2);  
  assert(resultStream.tail().tail().tail().head()===15);
  assert(resultStream.tail().tail().tail().tail().head()===19);
});
test("prodSeries", function(){
  let s1 = getStreamPlusN(2,1);
  let s2 = getStreamPlusN(1,1);
  let resultStream = prodSeries(s1,s2);
  assert(resultStream.head()===1);
  assert(resultStream.tail().head()===5);
  assert(resultStream.tail().tail().head()===14);
  //assert(resultStream.tail().tail().tail().isEmpty());
  assert(resultStream.tail().tail().tail().head()===30);
});
test("prodSeriesEx",function(){
  let s1 = getStreamPlusN(1,1);
  let s2 = snode(2,memo0(()=>snode(6,memo0(()=>snode(9,memo0(()=>sempty))))));
  let resultStream = prodSeries(s1,s2);  
  assert(resultStream.head()===2);
  assert(resultStream.tail().head()===10);
  assert(resultStream.tail().tail().head()===27);
});
test("prodSeriesFinite",function(){
  let s1 = snode(2,memo0(()=>snode(6,memo0(()=>sempty))));
  let s2 = snode(2,memo0(()=>snode(4,memo0(()=>snode(7,memo0(()=>sempty))))));
  let rs = prodSeries(s1,s2);
  assert(rs.head()===4);
  assert(!rs.tail().isEmpty());
  assert(!rs.tail().tail().isEmpty());
  assert(!rs.tail().tail().tail().isEmpty());
  assert(rs.tail().tail().tail().tail().isEmpty());

});
test("emptyAtIndex", function(){
  let s1 = snode(2,memo0(()=>sempty));
  assert(emptyAtIndex(s1,0)===false);
  assert(emptyAtIndex(s1,1));
  assert(emptyAtIndex(s1,2));
});
test("derivSeries",function(){
  let s = snode(2,memo0(()=>snode(4,memo0(()=>snode(7,memo0(()=>sempty))))));
  let s2 = snode(13,memo0(()=>snode(0,memo0(()=>snode(7,memo0(()=>snode(6,memo0(()=>sempty))))))));
  let rs = derivSeries(s);
  let rs2 = derivSeries(s2);
  assert(rs2.head()===0);
  assert(rs2.tail().tail().tail().isEmpty());
  assert(rs2.tail().tail().head()===18);
  assert(rs.head()===4);
  assert(rs.tail().head()===14);
  assert(rs.tail().tail().isEmpty());
});
test("coeffS", function(){
  let s1 = snode(13,memo0(()=>snode(0,memo0(()=>snode(7,memo0(()=>snode(6,memo0(()=>sempty))))))));
  let rs = coeffS(s1,2);
  let s2 = snode(120,memo0(()=>snode(5,memo0(()=>sempty))));
  let rs2 = coeffS(s2,10);
  assert(rs.tail().tail().head()===7);
  assert(rs.tail().tail().tail().isEmpty()); 
  assert(rs2.head()===120);
  assert(rs2.tail().head()===5);
  assert(rs2.tail().tail().isEmpty());
});
test("coeff",function(){
  let s1 = snode(13,memo0(()=>snode(0,memo0(()=>snode(7,memo0(()=>snode(6,memo0(()=>sempty))))))));
  let ra = coeff(s1,2);
  assert(ra[0]===13);
  assert(ra[1]===0);
  assert(ra[2]===7);
  assert(ra.length===3);
})
test("evalSeries", function(){
  let s1 = snode(13,memo0(()=>snode(1,memo0(()=>snode(7,memo0(()=>snode(6,memo0(()=>sempty))))))));
  let f = evalSeries(s1,2);
 // console.log(f(1));
  assert(f(1)===21);
  assert(f(2)===43);
});
test("rec1SeriesWithIncrementFunction",function(){
  function f(v){
    return v+1;
  }
  let s = rec1Series(f,0);
  assert(s.head()===0);
  assert(s.tail().head()===1);
  assert(s.tail().tail().head()===2);
  assert(s.tail().tail().tail().head()===3);
});
test("taylor", function(){
  let ts = expSeries(); 
  assert(ts.tail().tail().tail().head()-1/6<.1);
  assert(ts.tail().tail().tail().tail().head()-1/24<.1);
  assert(ts.tail().tail().tail().tail().tail().head()-1/120>-.1);
  
});
test("recurSeriesCampusWire",function(){
  let init = [4,5,6,7];
  let coef = [1,2,3,4];
  let rs = recurSeries(coef,init);
  assert(rs.head()===4);
  assert(rs.tail().head()===5);
  assert(rs.tail().tail().head()===6);
  assert(rs.tail().tail().tail().head()===7);
  assert(rs.tail().tail().tail().tail().head()===60);
  assert(rs.tail().tail().tail().tail().tail().head()===278);
  assert(rs.tail().tail().tail().tail().tail().tail().head()===1312);
});
test("recurSeriesCustom",function(){
  let init = [5,7];
  let coef = [2,3];
  let rs = recurSeries(coef,init);
  assert(rs.head()===5);
  assert(rs.tail().head()===7);
  assert(rs.tail().tail().head()===31);
  assert(rs.tail().tail().tail().head()===14+(31*3));  
});