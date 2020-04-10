module.exports = ServerEventsDispatcher;

function ServerEventsDispatcher(url){

    this.callbacks = {};
    this.conn;
    this.connect(url);
};

ServerEventsDispatcher.prototype.connect = function (url) {

    this.conn = new WebSocket(url);
    var callbacks = this.callbacks;

    // dispatch to the right handlers
    this.conn.onmessage = function(evt){
        var json = JSON.parse(evt.data)
        dispatch(json[0], json[1])
    };
    this.conn.onclose = function(){
        console.debug("conn closed"); 
        //dispatch('close',null);
        reconnect(url);
    }
    this.conn.onopen = function(){
        dispatch('open',null)
    }

    var dispatch = function(event_name, message){
        var chain = callbacks[event_name];
        if(typeof chain == 'undefined') return; // no callbacks for this event
        for(var i = 0; i < chain.length; i++){
        chain[i]( message )
        }
    }

    var reconnect = function (url) {
        this.conn = new WebSocket(url);
        //this.conn.open();
    };
};

ServerEventsDispatcher.prototype.bind = function(event_name, callback){
    this.callbacks[event_name] = this.callbacks[event_name] || [];
    this.callbacks[event_name].push(callback);
    return this;// chainable
};

ServerEventsDispatcher.prototype.emit = function(event_name, event_data){

      var payload = JSON.stringify({event:event_name, data: event_data});
      this.conn.send( payload ); // <= send JSON data to socket server
      return this;
};