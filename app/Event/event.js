/**
 * The module responsible for managing all of the events.
 */
define(['durandal/app', 'knockout', 'durandal/system', 'plugins/router', 'Shell/shell', 'Activity/activity', 'moment'], 
	function(app, ko, system, router, shell, activity, moment) {
	var pageTitle = ko.observable("Second Page"),
	
		//the list of all events that have been recorded
		events = ko.observableArray([]),
		
		//the id of the activity that is currently being viewed
		activityIndex = ko.observable(),
		
		//the list of events for the activity that is currently being viewed
		currentEvents = ko.computed(function() {
			var desiredData = [];
			
			//if no activity is currently being viewed, return all data
			if (activityIndex() != null) {
				for (var i=0; i<events().length; i++) {
					if (events()[i].activityId == activityIndex()) {
						desiredData.push(events()[i]);
					}
				}
			} else {
				desiredData = events();
			}
			
			//sort data by date with the most recent first
			desiredData.sort(function(a, b) {
				return b.time.localeCompare(a.time);
			});
			
			return desiredData;
		});
		
		
		function formatDate(date) {
			console.log(date);
			return date;
		}
	
	return {
		shell: shell,
		pageTitle: pageTitle,
		events: events,
		activityIndex: activityIndex,
		currentEvents: currentEvents,
		formatDate: formatDate,
		
		/**
		 * @param the id of the activity that is currently being viewed
		 */
		activate: function(activityId) {
			activityIndex(activityId);
			events(shell.fetchData('event'));
			
			if (activityIndex() != undefined) {
				pageTitle(activity.activities()[activityIndex()].name);
			}
		},
		
		/**
		 * Add a new event.
		 * @param activityId - the id of the activity to add the event to
		 * @param time - the time stamp for the event
		 */
		addItem: function(activityId, time) {
			//add data to the array
			events.push({ id: events().length, activityId: activityId, time: time });
			
			//save the data to local storage
			shell.storeData('event', events());
		},
		
		/**
		 * Get the color that should be used for this activity
		 *
		 * @param colorId - the color id of the current activity
		 */
		getColor: function(colorId) {
			var index = activity.activities()[activityIndex()].colorId;
			return activity.getColor(index);
		}
	};
});