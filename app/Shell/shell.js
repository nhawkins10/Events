define(['plugins/router', 'durandal/system', 'durandal/app', 'knockout'], function (router, system, app, ko) {
 var colors = [
	{
		name: "Red",
		value: "#DE2B2B",
		id: 0
	},
	{
		name: "Orange",
		value: "#FF6C19",
		id: 1
	},
	{
		name: "Yellow",
		value: "#F9D916",
		id: 2
	},
	{
		name: "Green",
		value: "#2CA63A",
		id: 3
	},
	{
		name: "Blue",
		value: "#3E82CF",
		id: 4
	},
	{
		name: "Purple",
		value: "#9D139D",
		id: 5
	}
 ];
  return {
	router: router,
	colors: colors,
    activate: function () {
		router.map([
				{ route: '', moduleId: 'Activity/activity', title: 'Activities', nav: true },
				{ route: 'event/:id', moduleId: 'Event/event', title: 'Events', nav: true }
			]).buildNavigationModel();
 
       return router.activate();
     },
	 
	 /**
	  * Launches the dialog to add an item.
	  *
	  * @param activityId - the id of the activity currently being viewed, defaults to 0
	  */
	 addItem: function(activityId) {
		app.showDialog('Add/add', activityId).then(function(dialogResult) {
			if (!dialogResult) {
				//dialog was canceled
				return;
			}
			//system.log(dialogResult['activity'].value + " " + dialogResult['date'].value + " " + dialogResult['time'].value);
		});
	 },
	 
	 /**
	  * Retrieves string data from local storage 
	  * and returns it as JSON.
	  *
	  * @param key - the key value to retrieve data for
	  * @return the JSON data from local storage
	  */
	 fetchData: function(key) {
		var data = localStorage.getItem(key);
		if (data == undefined) {
			return [];
		} else {
			return JSON.parse(data);
		}
	 },
	 
	 /**
	  * Writes JSON data out to local storage as a string.
	  *
	  * @param key - the key value to write data to
	  * @param data - the data to store
	  */
	 storeData: function(key, data) {
		localStorage.setItem(key, JSON.stringify(data));
	 }
   };
});