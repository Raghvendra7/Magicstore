var store = {};
var events = require('events');
var reducersByKey = {};
var reducersByEvent = {};

//Event Emitters
var stateEventEmitter = new events.EventEmitter();
var eventEmitter = new events.EventEmitter();

//Return the state identified by the key
var getState = function(key){
  var copy = null; //Default State
  if(typeof store[key] != "undefined"){
    //copy = _.cloneDeep(store[key]); //use this in case of mutation
    copy = store[key];
  }
  return copy;
};

//Set the state identified by the key
var setState = function(key, data){
  if(key && key != null && typeof key === "string" && key.length > 0){
    store[key] = data;
    //var dataCopy = JSON.parse(JSON.stringify(data));
    //emitState(key, dataCopy);

    emitState(key, data);
  }
};

//State Level Event Emitter Wrappers
var addStateListener = function(key, cb){
  stateEventEmitter.on(key, cb);
}

//Removes listeners for state changes on key
var removeStateListener = function(key, cb){
  stateEventEmitter.removeEventListener(key, cb);
}

//Updates listeners for state changes on key
var emitState = function(key){
  stateEventEmitter.emit(key);
}

//Adds listener for a particular event (events trigger reducers, which triggers state change)
var addEventListener = function(eventType, cb){
  eventEmitter.on(eventType, cb);
}

//Removes listener for events
var removeEventListener = function(eventType, cb){
  eventEmitter.removeEventListener(eventType, cb);
}

//Updates listeners of a particular event type
var emit = function(eventType, eventData){
  eventEmitter.emit(eventType, eventData);
}

//Attaches a reducer, which provides the updated state for the given key
//Note : 1 reducer maps to ONLY ONE key
//Also the reducer informs the store of the events it accepts to update the state
var attachReducer = function(key, eventTypes, cb){
  //Map reducers by key
  if(!reducersByKey[key]){
    reducersByKey[key] = [];
  }
  reducersByKey[key].push(cb);

  //Map reducers by Event Type
  for (var i = 0; i < eventTypes.length; i++) {
    var type = eventTypes[i];
    if(!reducersByEvent[type]){
      reducersByEvent[type] = [];
    }
    reducersByEvent[type].push({"key" : key, "reducer" : cb});
  }
}

//Triggers reducers associated with the event, which triggers state changes
var event = function(eventType, eventData){
  // Iterate over each reducer of this event type
  var reducers = reducersByEvent[eventType];
  if(reducers && reducers.length > 0){
    for (var i = 0; i < reducers.length; i++) {
      var reducerOb = reducers[i];
      var reducerKey = reducerOb["key"];
      var reducer = reducerOb["reducer"];

      var prevState = null;
      if(store[reducerKey]){
        //prevState = JSON.parse(JSON.stringify(store[reducerKey]));
        prevState = store[reducerKey];
      }
      var nextState = reducer(eventType, eventData, prevState);
      if(nextState){
        //We have something to set
        setState(reducerKey, nextState);
        eventEmitter.emit(eventType, eventData); //Inform all event listeners
      }
    }
  }
}

//Final Export
module.exports = {
  getState : getState,
  setState : setState,
  addStateListener : addStateListener,
  removeStateListener: removeStateListener,
  attachReducer: attachReducer,
  event: event,
  addEventListener: addEventListener,
  removeEventListener: removeEventListener
};
