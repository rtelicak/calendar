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
					console.err(err);
				});
		}();

		// create event items from database data
		var populateItems = function(data){
			var events = [];

			for ( var i = 0; i < data.length; i++) {
				var eventObj = {};

				eventObj.summary = data[i].summary;
				eventObj.startTime = data[i].startTime;
				eventObj.endTime = data[i].endTime;
				events.push(eventObj);
			}
			return events;
		}

		// Enable creation of event interactively by ctrl clicking grid.
		var createItem = function(view, d, e) {

			// create item by maintaining control key
			if (!e.ctrlKey || e.shiftKey || e.altKey || (!cal1 && !cal2)) {
				return null;
			}

			// create a new event
			var start, end;
			var colView = calendar.columnView;
			var cal = calendar.dateModule;

			if (view == colView) {
				start = calendar.floorDate(d, "minute", colView.timeSlotDuration);
				end = cal.add(start, "minute", colView.timeSlotDuration);
			} else {
				start = calendar.floorToDay(d);
				end = cal.add(start, "day", 1);
			}

			var item = {
				id : id,
				summary : "New event " + id,
				startTime : start,
				endTime : end,
			};

			id++;

			return item;
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

		contextMenuDelete.on("click", function() {
			arr.forEach(calendar.selectedItems, function(item) {
				calendar.store.remove(item.id);
			});
		});

		// refresh item panel on event selection.
		var editedItem;

		var selectionChanged = function(item) {

			var itemNull = item == null;

			// widgets = [
			// 	itemSummaryEditor,
			// 	itemStartDateEditor,
			// 	itemStartTimeEditor,
			// 	itemEndDateEditor,
			// 	itemEndTimeEditor,
			// 	//calendarEditor,
			// 	deleteItemButton,
			// 	saveBtn
			// ];

			arr.forEach(widgets, function(w) {
				w.set("disabled", itemNull);
				w.set("value", null, false);
			});

			editedItem = itemNull ? null : lang.mixin({}, item);

			if (!itemNull) {

				// var allDay = item.allDay === true;

				// itemStartTimeEditor.set("disabled", allDay);
				// itemEndTimeEditor.set("disabled", allDay);

				itemSummaryEditor.set("value", item.summary);
				itemStartDateEditor.set("value", item.startTime);
				itemStartTimeEditor.set("value", item.startTime);
				itemEndDateEditor.set("value", item.endTime);
				itemEndTimeEditor.set("value", item.endTime);
				//calendarEditor.set("value", item.calendar == "cal1" ? "Calendar 1" : "Calendar 2");
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

		// list of form widgets
		var widgets = [
			itemSummaryEditor, 
			itemStartDateEditor, 
			itemStartTimeEditor, 
			itemEndDateEditor, 
			itemEndTimeEditor
		];

		// handle click on newBtn, prepare form for new event
		newBtn.on("click", function(e) {
			// var date = new Date();
			// date.setHours(date.getHours() + 1);
			// itemSummaryEditor.set("value", "ccc");
			// itemStartDateEditor.set("value", new Date());
			// itemStartTimeEditor.set("value", new Date());
			// itemEndDateEditor.set("value", new Date());
			// itemEndTimeEditor.set("value", date);

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
		var updateItem = function(item){
			item.summary = itemSummaryEditor.get("value");
			item.startTime = mergeDateTime(true);
			item.endTime = mergeDateTime(false);

			return item;
		};

		// create new event, save to db and to store bidned to calendar widget
		var postEvent = function(item){
			delete item.id;
			item.startTime = item.startTime.getTime();
			item.endTime = item.endTime.getTime();

			xhr.post("http://localhost:8888/calendar/webServices/postData.php", {
		        data: item,
		        handleAs: "json"
		    }).then(function(id){
		    	var item = {};
		    	item.id = id;
		    	updateItem(item);
				calendar.store.add(item);
		    },
		    function(error){
		    	console.err(error);
		    });
		};

		saveBtn.on("click", function(value) {
			// update item
			if (editedItem != null ) {
				// editedItem.summary = itemSummaryEditor.get("value");
				// editedItem.startTime = mergeDateTime(true);
				// editedItem.endTime = mergeDateTime(false);
				//delete editedItem.allDay;
				var item = updateItem(editedItem);
				calendar.store.put(item);
			}
			// create new item
			else if (!isFormEmpty()){
				var item = updateItem({});
				postEvent(item);
			}
		});

		deleteItemButton.on("click", function(value) {
			if (editedItem != null) {
				calendar.store.remove(editedItem.id);
			}
		});

		fx.fadeOut({
			node : "loadingPanel",
			onEnd : function(node) {
				node.parentNode.removeChild(node)
			}
		}).play(500);

	});
});
