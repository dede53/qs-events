const ical                  = require("node-ical");
var adapter                 =	require('../../adapter-lib.js');
var events                  =	new adapter("events");
let calenderItems           = [];


events.on("events", function(data){
	if(!data){
        return;
    }
    switch(data.protocol){
        case "setSetting":
            events.setSetting(data);
            break;
        default:
            events.log.error("Problem mit dem Protocol:" + data.protocol);
            break;
    }
});

ical.parseFile(events.settings.filename, function(err, data){
    events.log.info("Lade Events:" + events.settings.filename);
    if (err){
        events.log.error(err);
        return;
    }
    for (let k in data) {
        if (data.hasOwnProperty(k)) {
            var ev = data[k];
            if (ev.type != 'VEVENT'){
                return;
            }
            calenderItems.push(new calenderItem(ev) );
        }
    }
    checkEvents();
});


setInterval(function(){
    checkEvents();
// Mili   Sek  Min  = jede 60 Minuten
}, 1000 * 60 * 60);




function checkEvents(){
    events.log.debug("checke Events");
    let todayName = "";
    let todayCounter = 0;
    let tomorrowName = "";
    let tomorrowCounter = 0;
    for(var index in calenderItems){
        let item = calenderItems[index];
        if(item.today()){
            todayCounter++;
            if(todayName == ""){
                todayName = item.summary;
            }else{
                todayName += "/" + item.summary;
            }
        }
        if(item.tomorrow()){
            tomorrowCounter++;
            if(tomorrowName == ""){
                tomorrowName = item.summary;
            }else{
                tomorrowName += "/" + item.summary;
            }
        }
    }
    if(todayCounter > 0){
        events.log.debug("Heute " + todayCounter + " Termine");
        events.log.debug(todayName);
        events.setVariable("events.today", true);
    }else{
        events.log.debug("Heute keine Termine");
        events.setVariable("events.today", false);
    }
    if(tomorrowCounter > 0){
        events.log.debug("Morgen " + tomorrowCounter + " Termine");
        events.log.debug(tomorrowName);
        events.setVariable("events.tomorrow", true);
    }else{
        events.log.debug("Morgen keine Termine");
        events.setVariable("events.tomorrow", false);
    }
    events.setVariable("events.today.name",         todayName);
    events.setVariable("events.today.counter",      todayCounter);
    events.setVariable("events.tomorrow.name",      tomorrowName);
    events.setVariable("events.tomorrow.counter",   tomorrowCounter);
}

function calenderItem(data){
    this.summary                = data.summary;
    this.start                  = new Date(data.start);
    this.stop                   = new Date(data.stop);
    events.log.debug(this.summary + " am " + this.start.toLocaleString("de-DE"));
}
calenderItem.prototype.today = function(){
    if(this.start.getMonth() == new Date().getMonth() && this.start.getDate() == new Date().getDate() ){
        return true;
    }else{
        return false;
    }
}
calenderItem.prototype.tomorrow = function(){
    const tomorrow = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
    if(this.start.getMonth() == tomorrow.getMonth() && this.start.getDate() == tomorrow.getDate() ){
        return true;
    }else{
        return false;
    }
}
