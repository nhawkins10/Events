/**
 *	The Events module allows for the creation of various custom categories and the 
 *	creation of multiple events (timestamps) within each category. Authentication
 *	and data storage are provided by Firebase.
 *
 *	Created: August 10, 2015
 * 	Author: Nathan Hawkins
 */
var Events = (function() {
	var dataRef = new Firebase("https://flickering-torch-7386.firebaseio.com/");
	var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
	
	function toDateInputValue() {
		var local = new Date();
		local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
		return local.toJSON().slice(0,10);
	};
	
	function toTimeInputValue() {
		var local = new Date();
		local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
		local = local.toJSON().slice(11);
		return local.split(".")[0];
	};
	
	function translateColor(colorId) {
		var color = '';
		switch (colorId) {
			case "1":
				color = "red";
				break;
			case "2":
				color = "orange";
				break;
			case "3":
				color = "yellow";
				break;
			case "4":
				color = "green";
				break;
			case "5":
				color = "blue";
				break;
			case "6":
				color = "purple";
				break;
			default:
				color = "blue";
		}
		return color;
	};
	
	function formatDate(timestamp) {
		var arr = timestamp.split(/[- :]/),
			date = new Date(arr[0], arr[1]-1, arr[2], arr[3], arr[4]),
			today = new Date(),
			dateString = "";
		
		if (isToday(date)) {
			dateString += date.getHours() > 12 ? date.getHours() - 12 : date.getHours();
			dateString += ":";
			dateString += date.getMinutes() > 9 ? date.getMinutes() : "0" + date.getMinutes();
			dateString += date.getHours() > 12 ? " pm" : " am";
		} else {
			dateString += months[date.getMonth()];
			dateString += " " + date.getDate();
			if (date.getFullYear() < today.getFullYear()) {
				dateString += ", " + date.getFullYear();
			}
			
			//format time
			dateString += "  " + (date.getHours() > 12 ? date.getHours() - 12 : date.getHours());
			dateString += ":";
			dateString += date.getMinutes() > 9 ? date.getMinutes() : "0" + date.getMinutes();
			dateString += date.getHours() > 12 ? " pm" : " am";
		}
		
		return dateString;
	};
	
	function isToday(date) {
		var today = new Date();
		
		if (date.getFullYear() === today.getFullYear() &&
			date.getMonth() === today.getMonth() &&
			date.getDate() === today.getDate()) {
			return true;
		}
		
		return false;
	};
	
	function determineTime(newerDate, olderDate) {
		var time = {
			value: 0,
			label: ""
		};
		var newerDateMoment = moment(newerDate),
			olderDateMoment = moment(olderDate);
		
		if (Math.abs(newerDateMoment.diff(olderDateMoment, 'years')) > 0) {
			time.value = Math.abs(newerDateMoment.diff(olderDateMoment, 'years'));
			time.label = 'year' + (time.value > 1 ? "s" : "");
		}  else if (Math.abs(newerDateMoment.diff(olderDateMoment, 'months')) > 0) {
			time.value = Math.abs(newerDateMoment.diff(olderDateMoment, 'months'));
			time.label = 'month' + (time.value > 1 ? "s" : "");
		} else if (Math.abs(newerDateMoment.diff(olderDateMoment, 'days')) > 0) {
			time.value = Math.abs(newerDateMoment.diff(olderDateMoment, 'days'));
			time.label = 'day' + (time.value > 1 ? "s" : "");
		} else if (Math.abs(newerDateMoment.diff(olderDateMoment, 'hours')) > 0) {
			time.value = Math.abs(newerDateMoment.diff(olderDateMoment, 'hours'));
			time.label = 'hour' + (time.value > 1 ? "s" : "");
		} else if (Math.abs(newerDateMoment.diff(olderDateMoment, 'minutes')) > 0) {
			time.value = Math.abs(newerDateMoment.diff(olderDateMoment, 'minutes'));
			time.label = 'minute' + (time.value > 1 ? "s" : "");
		}
		
		return time;
	}
	
	return {
		/**
		 *	The authentication module exposes functions related 
		 *	to state and user management.
		 */
		authentication: {
			/**
			 *	This function allows an existing user to be authenticated.
			 *	@param userParam - optional username, defaults to value of username textbox
			 * 	@param pwParam - optional password, defaults to value of password textbox
			 */
			login: function(userParam, pwParam) {	
				var user = userParam || document.getElementById('loginUser').value;
				var pw = pwParam || document.getElementById('loginPw').value;
				
				if (user != "" && pw != "") {
					dataRef.authWithPassword({
						email: user,
						password: pw
					}, function(error, userData) {
						if (error) {
							console.log("Login Failed!", error);
							switch (error.code) {
								case "INVALID_EMAIL":
								case "INVALID_PASSWORD":
									$("#loginError").text("The username or password is incorrect.");
									break;
								case "INVALID_USER":
									$("#loginError").text("The specified user account doesn't exist.");
									break;
								default:
									$("#loginError").text("There was an error logging in.");
							}
						} else {
							console.log("Authenticated successfully");
							
							//set session tokens
							localStorage.events = JSON.stringify({token: userData.token, uid: userData.uid});
							
							//redirect to main category view
							location.href = "../home"
						}
					});
				}
			},
			
			logout: function() {
				dataRef.unauth();
				location.href = "../login";
			},
			
			toggleCreateUser: function() {
				if ($("#signUpBtn").hasClass("hidden")) {
					$("#signUpBtn").removeClass("hidden");
					$("#loginBtn").addClass("hidden");
					$("#toggleCreateUserBtn").text("Already have an account");
					$("#loginError").text("");
				} else {
					$("#signUpBtn").addClass("hidden");
					$("#loginBtn").removeClass("hidden");
					$("#toggleCreateUserBtn").text("Create an account");
					$("#loginError").text("");
				}
			},
			
			/**
			 *	This function allows a new user to be created.
			 * 	@param none
			 */
			createUser: function() {
				var user = document.getElementById('loginUser').value,
					pw = document.getElementById('loginPw').value;
				
				if (user != "" && pw != "") {
					dataRef.createUser({
						email: user,
						password: pw
					}, function(error, userData) {
						if (error) {
							console.log("Create User Failed!", error);
							switch (error.code) {
								case "EMAIL_TAKEN":
									$("#loginError").text("That username is already taken.");
									break
								case "INVALID_EMAIL":
									$("#loginError").text("The username must be an email address.");
									break;
								default:
									$("#loginError").text("There was an error creating an account.");
							}
						} else {
							console.log("Authenticated successfully", userData);
							
							//create space for new user in database
							dataRef.child("users").child(userData.uid).set(
								{
									identification: {
										provider: "password",
										email: user
									}
								}
							);
							
							//authenticate the new user
							Events.authentication.login(user, pw);
						}
					});
				}
			},
			
			/**
			 *	This function checks if a user is currently logged in.
			 * 	@param none
			 * 	@return - true if any user is logged in, false otherwise
			 */
			userAuthenticated: function() {
				var authData = dataRef.getAuth();
				
				if (authData) {
					return true;
				} else {
					return false;
				}
			}
		},
		
		
		/**
		 *	The category module exposes functions related to displaying
		 * 	and creating categories for a user after they are authenticated.
		 */
		category: {
			/**
			 *	This function requests all categories for the current user
			 * 	and passes the data for each into a generation function.
			 *	@param none
			 */
			displayAllCategories: function() {
				var authTokens = JSON.parse(localStorage.events);
				dataRef.child("users").child(authTokens.uid).child("categories").on("child_added", function(snapshot) {
					var temp = snapshot.val();
					//hide loading spinner
					document.getElementById('spinner').className = "";
					
					//create HTML for category
					Events.category.displayCategory(temp.name, temp.color, snapshot.key());
				});
			},
			
			/**
			 * 	This function creates the markup to display a category.
			 * 	@param name - the title of the category
			 *	@param color - the color for the category
			 * 	@param key - the category identifier
			 */
			displayCategory: function(name, color, key) {
				var categoryList = document.getElementById("categoryList");
				categoryList.innerHTML = categoryList.innerHTML + 
					"<li class='categoryItem " + translateColor(color) + "' onclick=\"javascript:Events.navigate.toDetail(\'" + key + "\')\">" + name + "</li>";
			},
			
			/**
			 *	This function adds a new category to the 
			 * 	current user's list of categories.
			 *	@param name - the name of the category
			 *	@param color - the color for the category
			 *	@return - firebase reference to new category
			 */
			addCategory: function(name, color) {
				var authTokens = JSON.parse(localStorage.events);
					
				if (newCatName != "") {
					return dataRef.child("users").child(authTokens.uid).child("categories").push({
						name: name,
						color: color
					});					
				}
				
				return null;
			},
			
			/**
			 * 	This function deletes a category and all events
			 * 	that are associated with it.
			 */
			removeCategory: function() {
				var authTokens = JSON.parse(localStorage.events),
					key = location.search.substring(3, location.search.length),
					verifyDelete = confirm("Are you sure you want to delete this category and all it's data?");
				
				if (verifyDelete) {
					//remove the data
					dataRef.child("users").child(authTokens.uid).child("categories").child(key).remove();
					
					//return to the list of categories
					location.href = "../home";
				}
			},
			
			/**
			 *	This function toggles displaying the create new 
			 *	category form on the add event page.
			 *	@param none
			 */
			toggleNewCategory: function() {
				if ($("#newCatForm").hasClass("hidden")) {
					$("#newCatForm").removeClass("hidden");
					$("#categoryPicker").addClass("hidden");
					$(".addCatBtn").addClass("rotate");
				} else {
					$("#newCatForm").addClass("hidden");
					$("#categoryPicker").removeClass("hidden");
					$(".addCatBtn").removeClass("rotate");
				}
			}
		},
		
		/**
		 *	The event module exposes functions related to displaying 
		 *	and adding elements to the current event for the current user.
		 */
		event: {
			/**
			 *	This function requests all timestamps for the current category
			 * 	and passes the data for each into a generation function. The
			 *	category key is included in the url as a query parameter.
			 *	@param none
			 */
			displayEvent: function() {
				var key = location.search.substring(3, location.search.length),
					authTokens = JSON.parse(localStorage.events),
					color = '',
					self = this;
				
				//set the title to the name of the category
				dataRef.child("users").child(authTokens.uid).child("categories").child(key).once("value", function(snapshot) {
					var name = snapshot.val();
					document.getElementById("eventHeader").innerHTML = name.name;
					var elements = document.getElementById('eventList').children;
					for (var i=0; i<elements.length; i++) {
						elements[i].className += " " + translateColor(name.color);
					}
				});
				
				//display all events(timestamps) associated with the given category
				dataRef.child("users").child(authTokens.uid).child("categories").child(key).child("events").orderByChild("time").on("child_added", function(snapshot) {
					var temp = snapshot.val();
					//hide loading spinner
					document.getElementById('spinner').className = "";
					
					//create HTML for event
					Events.event.displayEntry(temp.time, self.color);
				});
			},
			
			/**
			 * 	This function creates the markup to display an event (timestamp) for a category.
			 * 	@param timestamp - the time of the event
			 */
			displayEntry: function(timestamp, color) {
				console.log(color);
				var entryList = document.getElementById("eventList");
				entryList.innerHTML = "<li class='eventItem'>" + formatDate(timestamp) + "</li>" + entryList.innerHTML;
			},
			
			/**
			 *	This function determines if the user is adding to a specific
			 *	category and redirects to the correct add page
			 */
			addEvent: function() {
				var key = location.search ? location.search.substring(3, location.search.length) : "";
				
				//currently viewing specific category
				if (key) {
					location.href = "../add?q=" + key;
				
				//viewing all categories
				} else {
					location.href = "../add";
				}
			},
			
			/**
			 *	This function populates the data on the add event page.
			 * @param none
			 */
			displayAdd: function() {
				var authTokens = JSON.parse(localStorage.events),
					key = location.search ? location.search.substring(3, location.search.length) : "",
					dropDown = document.getElementById("categoryPicker");
				
				//set default date and time
				document.getElementById("eventDate").value = toDateInputValue();
				document.getElementById("eventTime").value = toTimeInputValue();
				
				//populate the category dropdown
				dataRef.child("users").child(authTokens.uid).child("categories").on("child_added", function(snapshot) {
					var category = snapshot.val();
						
					dropDown.innerHTML = dropDown.innerHTML + 
						"<option value='" + snapshot.key() + "' " + (key == snapshot.key() ? "selected" : "") + ">" + category.name + "</option>";
				});
			},
			
			/**
			 *	This function saves the new event. It will also handle 
			 *	creating a new category if necessary.
			 */
			saveAdd: function() {
				var date = document.getElementById("eventDate").value,
					time = document.getElementById("eventTime").value,
					authTokens = JSON.parse(localStorage.events),
					categoryKey = "",
					key = location.search ? location.search.substring(3, location.search.length) : "";
					
				//determine the category
				if ($("#categoryPicker").hasClass("hidden")) {
					var category = document.getElementById("newCatName").value,
						categoryColor = document.getElementById("newCatColor").value;
					
					categoryKey = Events.category.addCategory(category, categoryColor).key();
				} else {
					categoryKey = document.getElementById("categoryPicker").value
				}
				
				//send the new value to the database
				dataRef.child("users").child(authTokens.uid).child("categories").child(categoryKey).child("events").push({
					time: date + " " + time
				});
				
				if (key) {
					location.href = "../detail?q=" + key;
				} else {
					location.href = "../home";
				}
			},
			
			/**
			 *	This function discards the new event data, and
			 *	returns to the previously viewed page.
			 * 	@param none
			 */
			cancelAdd: function() {
				var key = location.search ? location.search.substring(3, location.search.length) : "";
				
				if (key) {
					location.href = "../detail?q=" + key;
				} else {
					location.href = "../home";
				}
			}
		},
		
		/**
		 *	The navigate module exposes functions related to moving
		 * 	between the different pages within the app.
		 */
		navigate: {
			/**
			 *	This function navigates to the detail page and
			 *	displays data for the given key.
			 *	@param key - the category key to display details for
			 */
			toDetail: function(key) {
				location.href = "../detail?q=" + key;
			},
			
			/**
			 *	This function navigates to the home page where
			 *	a list of all categories is displayed.
			 *	@param - none
			 */
			toHome: function() {
				location.href = "../home";
			}
		},
		
		/**
		 *	The draw module exposes functions related to displaying
		 *	data is visual form on canvases. It uses the events for
		 *	a specific category, calculates various data points, and
		 *	displays that data in various graphics.
		 */
		draw: {
			dates: [],
			
			/**
			 *	This function populates the canvas with the stats data. It calculates
			 * 	the time since the last event, the maximum time between events, the 
			 *	average time between events, and the minimum time between events. It
			 * 	then draws graphs and data on canvases to represent the calculations.
			 *	@param color - the color to use on the canvas
			 */
			stats: function(color) {
				var ctx = document.getElementById("statsCanvas").getContext("2d"),
					canvasWidth = document.getElementById('statsCanvas').width,
					canvasHeight = document.getElementById('statsCanvas').height;
					
				//calculate time since last record
				var time = determineTime(new Date(), dates[0]),
					recentTime = time.value,
					recentTimeLabel = time.label;
				
				
				
				//draw time since last record
				var middle = 100,
					leftLeftPadding = 35;
				ctx.font = "80px Arial";
				ctx.fillStyle = color;
				ctx.fillText(recentTime, leftLeftPadding, middle);
				ctx.font = "12px Arial";
				ctx.fillStyle = "#000000";
				ctx.fillText(recentTimeLabel + " since", leftLeftPadding, middle + 25);
				ctx.fillText("last time", leftLeftPadding, middle + 44);
				
				//draw divider line
				var verticalPadding = 10;
				ctx.fillStyle = "#aaaaaa";
				ctx.fillRect(canvasWidth/2, verticalPadding, 1, canvasHeight - (verticalPadding * 2)); 
				
				
				//calculate max time between
				var maxTimeMillis = 0,
					maxTime = 0,
					maxTimeLabel = "",
					rightLeftPadding = 20;
				
				if (dates.length === 1) {
					maxTime = recentTime;
					maxTimeLabel = recentTimeLabel;
				} else {
					//set defaults
					time = determineTime(new Date(), dates[0]);
					maxTimeMillis = Math.abs(moment() - moment(dates[0]));
					maxTime = time.value;
					maxTimeLabel = time.label;
					
					//calculate max
					for (var i=1; i<dates.length; i++) {
						if (Math.abs(dates[i-1] - dates[i]) > maxTimeMillis) {
							maxTimeMillis = Math.abs(dates[i-1] - dates[i]);
							
							time = determineTime(dates[i-1], dates[i]);
							maxTime = time.value;
							maxTimeLabel = time.label;
						}
					}
				}
				
				//draw max
				ctx.font = "20px Arial";
				ctx.fillStyle = color;
				ctx.globalAlpha = .8;
				ctx.fillText(maxTime + " " + maxTimeLabel, (canvasWidth/2) + rightLeftPadding, canvasHeight/4);
				ctx.font = "11px Arial";
				ctx.fillStyle = "#000000";
				ctx.globalAlpha = 1;
				ctx.fillText("maximum time between", (canvasWidth/2) + rightLeftPadding, (canvasHeight/4) + 15);
				
				
				//calculate avg time between
				var avgTimeMillis = -1,
					avgTime = 0,
					avgTimeLabel = "";
					
				if (dates.length === 1) {
					avgTime = recentTime;
					avgTimeLabel = recentTimeLabel;
				} else {
					//calculate average
					var total = 0;
					for (var i=1; i<dates.length; i++) {
						total += Math.abs(dates[i-1] - dates[i])
					}
					
					var average = Math.round(total / dates.length);
					
					if (Math.round(moment.duration(average).asYears()) > 0) {
						avgTime = Math.round(moment.duration(average).asYears());
						avgTimeLabel = "year" + (moment.duration(average).asYears() > 1 ? "s" : "")
					} else if (Math.round(moment.duration(average).asMonths()) > 0) {
						avgTime = Math.round(moment.duration(average).asMonths());
						avgTimeLabel = "month" + (moment.duration(average).asMonths() > 1 ? "s" : "")
					} else if (Math.round(moment.duration(average).asDays()) > 0) {
						avgTime = Math.round(moment.duration(average).asDays());
						avgTimeLabel = "day" + (moment.duration(average).asDays() > 1 ? "s" : "")
					} else if (Math.round(moment.duration(average).asHours()) > 0) {
						avgTime = Math.round(moment.duration(average).asHours());
						avgTimeLabel = "hour" + (moment.duration(average).asHours() > 1 ? "s" : "")
					}
				}
				
				//draw average
				ctx.font = "20px Arial";
				ctx.fillStyle = color;
				ctx.globalAlpha = .8;
				ctx.fillText(avgTime + " " + avgTimeLabel, (canvasWidth/2) + rightLeftPadding, (canvasHeight/4)*2);
				ctx.font = "11px Arial";
				ctx.fillStyle = "#000000";
				ctx.globalAlpha = 1;
				ctx.fillText("average time between", (canvasWidth/2) + rightLeftPadding, ((canvasHeight/4)*2) + 15);
				
				
				//calculate min time between
				var minTimeMillis = -1,
					minTime = 0,
					minTimeLabel = "";
				
					
				if (dates.length === 1) {
					minTime = recentTime;
					minTimeLabel = recentTimeLabel;
				} else {
					//set defaults
					time = determineTime(new Date(), dates[0]);
					minTimeMillis = Math.abs(moment() - moment(dates[0]));
					minTime = time.value;
					minTimeLabel = time.label;
					
					//calculate min
					for (var i=1; i<dates.length; i++) {
						if (Math.abs(dates[i-1] - dates[i]) < minTimeMillis || minTimeMillis == -1) {
							minTimeMillis = Math.abs(dates[i-1] - dates[i]);
							
							time = determineTime(dates[i-1], dates[i]);
							minTime = time.value;
							minTimeLabel = time.label;
						}
					}
				}
				
				//draw min
				ctx.font = "20px Arial";
				ctx.fillStyle = color;
				ctx.globalAlpha = .8;
				ctx.fillText(minTime + " " + minTimeLabel, (canvasWidth/2) + rightLeftPadding, (canvasHeight/4)*3);
				ctx.font = "11px Arial";
				ctx.fillStyle = "#000000";
				ctx.globalAlpha = 1;
				ctx.fillText("minimum time between", (canvasWidth/2) + rightLeftPadding, ((canvasHeight/4)*3) + 15);
			},
			
			
		}
	};
})();

