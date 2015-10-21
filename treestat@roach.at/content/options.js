"use strict"

var TreeStatOptions = {
  prefs : null,
  active : null,
  alltrees : null,

  // XUL elements
  activeList : null,
  inactiveList : null,
  upButton: null,
  downButton: null,
  leftButton: null,
  rightButton: null,

  init : function() {
    this.activeList = document.getElementById("treestat-active");
    this.inactiveList = document.getElementById("treestat-inactive");
    this.upButton = document.getElementById("up");
    this.downButton = document.getElementById("down");
    this.leftButton = document.getElementById("left");
    this.rightButton = document.getElementById("right");
    this.prefs =  Components.classes["@mozilla.org/preferences-service;1"]
                  .getService(Components.interfaces.nsIPrefService)
                  .getBranch("extensions.treestat.");
    var active = this.prefs.getCharPref("trees").split("|");
    for (var item in active) {
      this.activeList.appendItem(active[item],active[item]);
    }
    if (!this.alltrees)
    {
      this.alltrees = [];
      var httpRequest = new XMLHttpRequest();
      httpRequest.onreadystatechange = function() {
        if (httpRequest.readyState === 4) {
          var treestat = JSON.parse(httpRequest.responseText)['result'];
          var trees = [];
          for (var item in treestat) {
            TreeStatOptions.alltrees.push(item);
          }
        }
        TreeStatOptions.populateInactive();
      }
      httpRequest.open('GET',this.prefs.getCharPref("rooturl")+"trees");
      httpRequest.send(null);
    } else {
      this.populateInactive();
    }
  },

  populateInactive : function() {
    var include = true;
    while (this.inactiveList.itemCount) {
      this.inactiveList.removeItemAt(0);
    }
    for (var item in this.alltrees.sort()) {
      include = true;
      for (var j=0; j < this.activeList.itemCount; j++) {
        if (this.activeList.getItemAtIndex(j).value == this.alltrees[item]) {
          include = false;
        }
      }
      if (include) {
        this.inactiveList.appendItem(this.alltrees[item],this.alltrees[item]);
      }
    }
  },

  upPressed : function() {
    this.moveItem(this.activeList,-1);
  },

  downPressed : function() {
    this.moveItem(this.activeList,1);
  },

  moveItem : function(list,distance) {
    var curItem = list.getItemAtIndex(list.currentIndex);
    var swapItem = list.getItemAtIndex(list.currentIndex + distance);

    var tempLabel = swapItem.label;
    var tempValue = swapItem.value;
    var tempTooltipText = swapItem.tooltipText;

    swapItem.label = curItem.label;
    swapItem.value = curItem.value;
    swapItem.tooltipText = curItem.tooltipText;

    curItem.label = tempLabel;
    curItem.value = tempValue;
    curItem.tooltipText = tempTooltipText;

    list.selectItem(swapItem);
  },

  leftPressed : function() {
    var newTree = this.inactiveList.selectedItem.value;
    this.activeList.appendItem(newTree,newTree);
    this.populateInactive();

    this.leftButton.disabled = true;
  },

  rightPressed : function() {
    this.activeList.removeItemAt(this.activeList.selectedIndex);
    this.populateInactive();

    this.rightButton.disabled = true;
    this.upButton.disabled = true;
    this.downButton.disabled = true;
  },

  activeSelect : function() {
    this.upButton.disabled=!(this.activeList.selectedIndex > 0);

    this.downButton.disabled=!(this.activeList.selectedIndex
                               < this.activeList.itemCount-1);

    this.rightButton.disabled = false;
  },

  inactiveSelect : function() {
    this.leftButton.disabled = false;
  },

  commit : function() {
    var active = [];
    for (var j=0; j < this.activeList.itemCount; j++) {
      active.push(this.activeList.getItemAtIndex(j).value);
    }
    this.prefs.setCharPref("trees",active.join('|'));
  },

}
