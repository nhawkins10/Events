/**
 * The module responsible for managing all of the activities.
 */
define(['durandal/app', 'knockout', 'durandal/system', 'Shell/shell'], function (app, ko, system, shell) {
	var activities = ko.observableArray([]),
		pageTitle = ko.observable('Main Page');
	
	return {
		shell: shell,
		pageTitle: pageTitle,
		activities: activities,
		activate: function() {
			//retrieve data from local storage and stores it
			activities(shell.fetchData('activity'));
		},
		
		/**
		 * Adds an activity.
		 *
		 * @param name - the name of the activity
		 * @param color - the id of the color to use for the activity
		 * @return the id of the new activity
		 */
		addItem: function(name, color) {
			//add data to the array
			activities.push({ name: name, id: activities().length, colorId: color });
			
			//save the data to local storage
			shell.storeData('activity', activities());
			
			return activities().length - 1;
		},
		
		/**
		 * Gets the hex value of a color.
		 *
		 * @param colorId - the id of the color to retrieve.
		 */
		getColor: function(colorId) {
			return shell.colors[colorId].value;	
		}
	};
});