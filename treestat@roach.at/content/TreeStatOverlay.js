"use strict"


var TreeStatOverlay = {
  prefs : null,
  active : null,
  timer : null,
  icon : {
    "closed": "red.png",
    "open": "green.png",
    "approval required": "yellow.png"
  },
  appInfo: null,
  FIREFOX_ID: "{ec8030f7-c20a-464f-9b0e-13a3a9e97384}",
  THUNDERBIRD_ID: "{3550f703-e582-4d05-9a08-453d09bdfdc6}",
  SEAMONKEY_ID: "{92650c4d-4b8e-4d2a-b7eb-24ecf4f6b63a}",

  init: function() {
    this.prefs =  Components.classes["@mozilla.org/preferences-service;1"]
                  .getService(Components.interfaces.nsIPrefService)
                  .getBranch("extensions.treestat.");
    this.appInfo = Components.classes["@mozilla.org/xre/app-info;1"]
                   .getService(Components.interfaces.nsIXULAppInfo);

    this.active = this.prefs.getCharPref("trees").split("|");
    this.removeGems(); // clear out fake images
    this.insertGems();
    this.timer = window.setInterval(function(){this.loadstat();}.bind(this),
                          1000 * this.prefs.getIntPref("frequency"));
    this.prefs.addObserver("",this,false);
  },

  removeGems: function() {
    var toolbaritem = document.getElementById("treestat-toolbar-item");
    while (toolbaritem && toolbaritem.firstChild) {
      toolbaritem.removeChild(toolbaritem.firstChild);
    }
  },

  makeOnClick : function (url) {
    if (this.appInfo.ID == this.FIREFOX_ID) {
      return function () { openUILinkIn(url,"tab"); };
    } else if (this.appInfo.ID == this.THUNDERBIRD_ID) {
      return function () { messenger.launchExternalURL(url) };
    }
  },

  insertGems : function() {
    var toolbaritem = document.getElementById("treestat-toolbar-item");
    if (!toolbaritem) {
      return;
    }
    var hbox = document.createElement("hbox");
    var first = true;
    // Insert an image for each watched tree
    for (var item in this.active) {
      var vbox = document.createElement("vbox");
      var image = document.createElement("image");
      var topspacer = document.createElement("spacer");
      var bottomspacer = document.createElement("spacer");
      image.setAttribute("tooltiptext",this.active[item]);
      image.addEventListener("click", this.makeOnClick(
          this.prefs.getCharPref("rooturl") + 'details/' + this.active[item]),
        false);
      image.setAttribute("src","chrome://treestat/content/unknown.png");
      image.setAttribute("maxheight",this.prefs.getIntPref("gemsize"));
      image.setAttribute("id","treestat-" + this.active[item] + "-image");
      topspacer.setAttribute("flex",1);
      bottomspacer.setAttribute("flex",1);
      vbox.appendChild(topspacer);
      vbox.appendChild(image);
      vbox.appendChild(bottomspacer);
      if (!first) {
        var separator = document.createElement("separator");
        separator.setAttribute("width",2);
        hbox.appendChild(separator);
      }
      first = false;
      hbox.appendChild(vbox);
    }
    toolbaritem.appendChild(hbox);
    this.loadstat();
  },

  loadstat : function () {
    var httpRequest = new XMLHttpRequest();
    httpRequest.onreadystatechange = function() {
      if (httpRequest.readyState === 4) {
        if (httpRequest.status >= 200 && httpRequest.status < 300) {
          // Color the gems
          var treestat = JSON.parse(httpRequest.responseText);
          this.setGemState(treestat['result']);
        } else {
          this.setUnknownState(httpRequest.statusText);
        }
      }
    }.bind(this);
    // If it takes more than half the refresh time, indicate a problem.
    httpRequest.timeout = 500 * this.prefs.getIntPref("frequency");
    httpRequest.ontimeout = function() { this.setUnknownState("Timeout"); }.bind(this);
    httpRequest.open('GET',this.prefs.getCharPref("rooturl")+"trees");
    httpRequest.setRequestHeader("Accept", "application/json");
    httpRequest.send(null);
  },

  setGemState : function(treestat) {
    for (var i in this.active) {
      var tree = this.active[i];
      var gem = document.getElementById("treestat-" + tree + "-image");
      var stat = treestat[tree]["status"];
      var description = treestat[tree]["reason"];

      if (!description.length) {
        description = treestat[tree]["message_of_the_day"];
      }

      if (!description.length) {
        description = stat;
      }

      description = description.replace(/<(?:.|\n)*?>/gm, '');

      gem.setAttribute("tooltiptext",tree + ": " + description);
      gem.setAttribute("src","chrome://treestat/content/"+this.icon[stat]);
    }
  },

  setUnknownState : function (errstring) {
    for (var i in this.active) {
      var tree = this.active[i];
      var gem = document.getElementById("treestat-" + tree + "-image");
      gem.setAttribute("tooltiptext",tree + ": " + errstring);
      gem.setAttribute("src","chrome://treestat/content/unknown.png");
    }
  },

  shutdown: function() {
    this.prefs.removeObserver("", this);
  },

  observe: function(subject, topic, data) {
    if (topic != "nsPref:changed") {
     return;
    }

    switch(data) {
      case "trees":
        this.removeGems();
        this.active = this.prefs.getCharPref("trees").split("|");
        this.insertGems();
        break;
      case "rooturl":
        // Update the "clicked" URL for the gems
        this.removeGems();
        this.insertGems();
        break;
      case "frequency":
        break;
      case "gemsize":
        this.removeGems();
        this.insertGems();
        break;
    }
  }

}

window.addEventListener("load", function load(event){
    window.removeEventListener("load", load, false);
    TreeStatOverlay.init();
},false);
