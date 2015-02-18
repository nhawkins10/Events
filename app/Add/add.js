/**
 * The module displayed in the add modal dialog.
 */
define(['durandal/system', 
		'plugins/dialog', 
		'Shell/shell', 
		'Activity/activity', 
		'Event/event', 
		'knockout'], function(system, dialog, shell, activity, event, ko) {
	var currentDate = new Date();
	
	//a list of all activities
	var selectedActivity = ko.observable(),
	
		//a list of all activities with the 'add new activity' item appended
		displayActivities = ko.computed(function() {
			var temp = [];
			for (var i=0; i<activity.activities().length; i++) {
				temp.push(activity.activities()[i]);
			}
			temp.push({ name: 'Add new activity...', id: 'new' });
			return temp;
		});
	
	/** 
	 * Format the time in a way that can be used as a default value for the time input.
	 *
	 * @return the time formatted as HH:MM
	 */
	function formatTime() {
		var hours = currentDate.getHours(),
			minutes = currentDate.getMinutes(),
			hoursString,
			minutesString;
			
		//pad hours with zero if necessary
		if (hours < 10) {
			hoursString = "0" + hours.toString();
		} else {
			hoursString = hours.toString();
		}
		
		//pad minutes with zero if necessary
		if (minutes < 10) {
			minutesString = "0" + minutes.toString();
		} else {
			minutesString = minutes.toString();
		}
		
		return hoursString + ":" + minutesString;
	}

	
	return {
		colors: shell.colors,
		activities: activity.activities(),
		displayActivities: displayActivities,
		selectedActivity: selectedActivity,
		
		time: formatTime(),
		
		//date string formatted in a way that can be used as 
		//the default value for the date picker: YYYY-MM-DD
		date: '' + currentDate.toISOString().substring(0, 10),
		
		/**
		 * @param activityId - the id of the activity that is currently being viewed
		 */
		activate: function(activityId) {
			selectedActivity(activityId);
		},
		
		/**
		 * Close the add dialog.
		 *
		 * @param dialogResult - the form object from the add dialog
		 */
		closeDialog: function(dialogResult) {
			dialog.close(this, false);
		},
		
		/**
		 * Parses event data and passes it to the add event handler in event.js
		 *
		 * @param formElement - the form object from the add dialog
		 */
		addItem: function(formElement) {
			var activityId = document.forms['newItem'].elements['activity'].value,
				time = document.forms['newItem'].elements['time'].value,
				date = document.forms['newItem'].elements['date'].value;
			
			event.addItem(activityId, date + " " + time);
			dialog.close(this, formElement);
		},
		
		/**
		 * Parses new activity data and passes it to the add activity handler in activity.js
		 */
		addActivity: function() {
			var name = document.forms['newItem'].elements['newActivityName'].value,
			
				//the color select dropdown object
				colorSelect = document.forms['newItem'].elements['newActivityColor'],
				
				//the id of the desired color
				color = colorSelect.options[colorSelect.selectedIndex].value;
			
			var newId = activity.addItem(name, color);
			
			//display the newly created activity in the add dialog dropdown
			selectedActivity(newId);
		}
	};
});