require([
	"dojo/ready",
	"dojo/_base/lang",
	"dojo/_base/sniff",
	"dojo/_base/array",
	"dojo/_base/fx",
	"dojo/on",
	"dojo/date/locale",
	"dojo/parser",
	"dojo/dom",
	"dojo/dom-construct",
	"dojo/store/Memory",
	"dojo/store/Observable",
	"dojox/calendar/Calendar",
	"dojo/request/xhr",

	// screen widgets
	"dijit/Calendar",		
	"dijit/TitlePane",
	"dijit/layout/BorderContainer",
	"dijit/layout/ContentPane",
	"dijit/form/CheckBox",
	"dijit/form/TextBox",
	"dijit/form/DateTextBox",
	"dijit/form/TimeTextBox",
	"dijit/form/Button",
	"dijit/form/ComboBox",
	"dijit/Menu",
	"dijit/MenuItem"
],

function(ready, lang, has, arr, fx, on, locale, parser, dom, domConstruct, Memory, Observable, Calendar, xhr) {

	ready(function() {

		// list of form widgets
		var widgets = [
			itemSummaryEditor, 
			itemStartDateEditor, 
			itemStartTimeEditor, 
			itemEndDateEditor, 
			itemEndTimeEditor
		];

		var someData = [];
		var startOfWeek = new Date();

		// set event items from db to calendar widget
		var getData = function(){
			var def = xhr("http://localhost:8888/calendar/webServices/getData.php", {
				handleAs: "json",
				method: "get"
				}, true);
			def.then(function(data){
					if (data.events.length){
						calendar.set("store", new Observable(new Memory({
							data : populateItems(data.events)
						})));
						calendar.set("date", startOfWeek);
						console.debug(calendar.store.data);
					}else{
						console.warn("No data in db.");
					}
				}, function(err){
					console.error(err);
				});
		}();

		var disableWidgets = function(){
			for (var i = 0; i < widgets.length; i++){
				widgets[i].set("disabled", true);
				widgets[i].reset();
			}
		}();

		// create event items from database data
		var populateItems = function(data){
			var events = [];

			for ( var i = 0; i < data.length; i++) {
				var eventObj = {};

				eventObj.id = data[i].id;
				eventObj.summary = data[i].summary;
				eventObj.startTime = data[i].startTime;
				eventObj.endTime = data[i].endTime;
				events.push(eventObj);
			}
			return events;
		}

		// show context menu on right clicking an event
		calendar.on("itemContextMenu", function(e) {
			dojo.stopEvent(e.triggerEvent);
			calendarContextMenu._openMyself({
				target : e.renderer.domNode,
				coords : {
					x : e.triggerEvent.pageX,
					y : e.triggerEvent.pageY
				}
			});
		});

		// handle event selection changed
		var selectionChanged = function(item) {

			var itemNull = item == null;
			editedItem = itemNull ? null : lang.mixin({}, item);

			arr.forEach(widgets, function(w) {
				w.set("disabled", itemNull);
				w.set("value", null, false);
			});

			if (!itemNull) {
				itemSummaryEditor.set("value", item.summary);
				itemStartDateEditor.set("value", item.startTime);
				itemStartTimeEditor.set("value", item.startTime);
				itemEndDateEditor.set("value", item.endTime);
				itemEndTimeEditor.set("value", item.endTime);
			}
		}


		calendar.on("change", function(e) {
			selectionChanged(e.newValue);
		});

		calendar.on("itemEditEnd", function(e) {
			selectionChanged(e.item);
		});

		var mergeDateTime = function(isStart) {
			var dateEditor = isStart ? itemStartDateEditor : itemEndDateEditor;
			var timeEditor = isStart ? itemStartTimeEditor : itemEndTimeEditor;
			var date = dateEditor.get("value");
			var time = timeEditor.get("value");
			date.setHours(time.getHours());
			date.setMinutes(time.getMinutes());
			return date;
		};

		// handle click on newBtn, prepare form for new event
		newBtn.on("click", function(e) {
			// mock
			// var date = new Date();
			// date.setHours(date.getHours() + 1);
			// itemSummaryEditor.set("value", "ccc");
			// itemStartDateEditor.set("value", new Date());
			// itemStartTimeEditor.set("value", new Date());
			// itemEndDateEditor.set("value", new Date());
			// itemEndTimeEditor.set("value", date);
			editedItem = null;
			for (var i = 0; i < widgets.length; i++){
				widgets[i].set("disabled", false);
				widgets[i].reset();
			}
		});

		// check if form for creating events is empty
		var isFormEmpty = function(){
			var empty = false;
			for (var i = 0; i < widgets.length; i++){
				if (!widgets[i].get("value")){
					empty = true;
					break;
				}
			}
			return empty;
		}

		// get item from form widgets
		var fetchItemFromForm = function(item){
			item.summary = itemSummaryEditor.get("value");
			item.startTime = mergeDateTime(true);
			item.endTime = mergeDateTime(false);

			return item;
		};

		saveBtn.on("click", function() {
			var item = editedItem || null;
			// update item
			if (item) {
				var item = fetchItemFromForm(item);
				updateItem(item);
			}
			// create new item
			else if (!isFormEmpty()){
				var item = fetchItemFromForm({});
				createItem(item);
			}
		});

		contextMenuDelete.on("click", function() {
			var item = calendar.selectedItems;
			if (calendar.selectedItems && calendar.selectedItems.length == 1){
				deleteItem(calendar.selectedItems);
			}
		});


		deleteItemButton.on("click", function() {
			if (editedItem != null) {
				deleteItem(editedItem);
			}
		});

		// edit event, save it to db and to store
		var updateItem = function(item){
			item.startTime = item.startTime.getTime();
			item.endTime = item.endTime.getTime();

			xhr.post("http://localhost:8888/calendar/webServices/updateData.php", {
		        data: item,
		        handleAs: "json"
		    }).then(function(id){
		    	var item = fetchItemFromForm(editedItem);
		    	item.id = id;
				calendar.store.put(item);
		    },
		    function(error){
		    	console.error(error);
		    });
		};

		// create new event, save it to db and to store
		var createItem = function(item){
			delete item.id;
			item.startTime = item.startTime.getTime();
			item.endTime = item.endTime.getTime();

			xhr.post("http://localhost:8888/calendar/webServices/postData.php", {
		        data: item,
		        handleAs: "json"
		    }).then(function(id){
		    	var item = {};
		    	item.id = id;
		    	fetchItemFromForm(item);
				calendar.store.add(item);
				editedItem = item;
		    },
		    function(error){
		    	console.error(error);
		    });
		};

		var deleteItem = function(item){
			if (item){
				xhr.post("http://localhost:8888/calendar/webServices/deleteData.php", {
			        data: editedItem,
			        handleAs: "json"
			    }).then(function(id){
					calendar.store.remove(id);
					},
					function(error){
						console.error(error);
					});
			}
		};

		fx.fadeOut({
			node : "loadingPanel",
			onEnd : function(node) {
				node.parentNode.removeChild(node)
			}
		}).play(500);

	});
});
