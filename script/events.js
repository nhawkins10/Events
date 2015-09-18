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
		var color = {
			name: '',
			hex: ''
		};
		switch (colorId) {
			case "1":
				color.name = "red";
				color.hex = "#F44336";
				break;
			case "2":
				color.name = "orange";
				color.hex = "#FF9800";
				break;
			case "3":
				color.name = "yellow";
				color.hex = "#795548";
				break;
			case "4":
				color.name = "green";
				color.hex = "#4CAF50";
				break;
			case "5":
				color.name = "blue";
				color.hex = "#00BCD4";
				break;
			case "6":
				color.name = "purple";
				color.hex = "#9C27B0";
				break;
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
	
	function removeCallbacks(key) {
		var authTokens = JSON.parse(localStorage.events);
		if (key) {
			dataRef.child("users").child(authTokens.uid).child("categories").child(key).child("events").orderByChild("time").off();
		}
		dataRef.child("users").child(authTokens.uid).child("categories").off();
		
		Events.draw.dates = [];
	}
	
	function scaleCanvas(canvas) {
		var context = canvas.getContext('2d'),
			devicePixelRatio = window.devicePixelRatio || 1,
			backingStoreRatio = context.webkitBackingStorePixelRatio ||	
								context.mozBackingStorePixelRatio ||
								context.msBackingStorePixelRatio ||
								context.oBackingStorePixelRatio ||
								context.backingStorePixelRatio || 1,
			ratio = devicePixelRatio / backingStoreRatio;
			
		if (devicePixelRatio !== backingStoreRatio) {
			var oldWidth = canvas.width;
			var oldHeight = canvas.height;
			
			canvas.width = oldWidth * ratio;
			canvas.height = oldHeight * ratio;
			
			canvas.style.width = oldWidth + 'px';
			canvas.style.height = oldHeight + 'px';
			
			context.scale(ratio, ratio);
		}
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
							Events.navigate.toHome();
						}
					});
				}
			},
			
			logout: function() {
				dataRef.unauth();
				Events.navigate.toLogin();
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
					"<div class='categoryItem " + translateColor(color).name + " mdl-shadow--4dp' onclick=\"javascript:Events.navigate.toDetail(\'" + key + "\')\"><div class='whiteText mdl-card__title'>" + name + "</div></div>";
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
			removeCategory: function(key) {
				var authTokens = JSON.parse(localStorage.events),
					verifyDelete = confirm("Are you sure you want to delete this category and all it's data?");
				
				if (verifyDelete) {
					//remove the data
					dataRef.child("users").child(authTokens.uid).child("categories").child(key).remove();
					
					//return to the list of categories
					Events.navigate.toHome();
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
			displayEvent: function(key) {
				var authTokens = JSON.parse(localStorage.events),
					color = '',
					self = this;
				
				//set the title to the name of the category
				dataRef.child("users").child(authTokens.uid).child("categories").child(key).once("value", function(snapshot) {
					var name = snapshot.val();
					document.getElementById("headerTitle").innerHTML = name.name;
					
					//set the color of the elements
					var elements = document.getElementById('eventList').children;
					for (var i=0; i<elements.length; i++) {
						elements[i].className += " " + translateColor(name.color).name;
					}
					
					//display all events(timestamps) associated with the given category
					dataRef.child("users").child(authTokens.uid).child("categories").child(key).child("events").orderByChild("time").on("child_added", function(snapshot) {
						var temp = snapshot.val();
						//hide loading spinner
						//if (document.getElementById('spinner')) {
							document.getElementById('spinner').className = "";
						//}
						
						//create HTML for event
						//if (document.getElementById("eventList")) {
							Events.event.displayEntry(temp.time, name.color);
							
							//add date to list for graphics
							var arr = temp.time.split(/[- :]/),
								date = new Date(arr[0], arr[1]-1, arr[2], arr[3], arr[4]);
							Events.draw.dates.push(date);
						//}
					});
					
					//make a call to draw the graphics
					dataRef.child("users").child(authTokens.uid).child("categories").child(key).child("events").once("value", function(data) {
						Events.draw.stats(translateColor(name.color).hex);
						Events.draw.timeOfDay(translateColor(name.color).hex);
						Events.draw.dayOfWeek(translateColor(name.color).hex);
					});
				});
			},
			
			/**
			 * 	This function creates the markup to display an event (timestamp) for a category.
			 * 	@param timestamp - the time of the event
			 */
			displayEntry: function(timestamp, color) {
				var entryList = document.getElementById("eventList");
				entryList.innerHTML = "<li class='eventItem " + translateColor(color).name + "'>" + formatDate(timestamp) + "</li>" + entryList.innerHTML;
			},
			
			/**
			 *	This function determines if the user is adding to a specific
			 *	category and redirects to the correct add page
			 */
			addEvent: function(key) {//currently viewing specific category
				if (key) {
					Events.navigate.toAdd(key);
				
				//viewing all categories
				} else {
					Events.navigate.toAdd();
				}
			},
			
			/**
			 *	This function populates the data on the add event page.
			 * @param none
			 */
			displayAdd: function(key) {
				var authTokens = JSON.parse(localStorage.events),
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
			saveAdd: function(key) {
				var date = document.getElementById("eventDate").value,
					time = document.getElementById("eventTime").value,
					authTokens = JSON.parse(localStorage.events),
					categoryKey = "";
					
				//determine the category
				if ($("#categoryPicker").hasClass("hidden")) {
					var category = document.getElementById("newCatName").value,
						categoryColor = document.getElementById("newCatColor").value;
					
					categoryKey = Events.category.addCategory(category, categoryColor).key();
				} else {
					categoryKey = document.getElementById("categoryPicker").value
				}
				
				removeCallbacks(categoryKey);
				
				//send the new value to the database
				dataRef.child("users").child(authTokens.uid).child("categories").child(categoryKey).child("events").push({
					time: date + " " + time
				});
				
				if (key) {
					Events.navigate.toDetail(key);
				} else {
					Events.navigate.toHome();
				}
			},
			
			/**
			 *	This function discards the new event data, and
			 *	returns to the previously viewed page.
			 * 	@param none
			 */
			cancelAdd: function(key) {				
				if (key) {
					Events.navigate.toDetail(key);
				} else {
					Events.navigate.toHome();
				}
			}
		},
		
		/**
		 *	The navigate module exposes functions related to moving
		 * 	between the different pages within the app.
		 */
		navigate: {
			/**
			 *	This function navigates to the login page.
			 *	@param - none
			 */
			toLogin: function() {
				//update main menu bar
				$("#backBtn").addClass("hidden");
				$("#headerTitle").text("Events");
				$("#demo-menu-lower-right").addClass("hidden");
				
				$("#pageContainer").load("templates/login.html");
			},
			
			/**
			 *	This function navigates to the detail page and
			 *	displays data for the given key.
			 *	@param key - the category key to display details for
			 */
			toDetail: function(key) {
				removeCallbacks(key);
				
				//update main menu bar
				$("#backBtn").removeClass("hidden");
				$("#deleteBtn").removeClass("hidden");
				
				$("#pageContainer").load("templates/detail.html", function() {
					$("#add").on("click", function() {
						Events.event.addEvent(key);
					});
					
					$("#deleteBtn").on("click", function() {
						Events.category.removeCategory(key);
					});
					
					componentHandler.upgradeElement(document.getElementById('detailPage'));
					Events.event.displayEvent(key);
				});
			},
			
			/**
			 *	This function navigates to the add page. If
			 *	key is provided it is passed to the add page
			 *	as a query parameter, otherwise the default
			 *	add page is loaded.
			 *	@param { key | null } - the key to add to, or null for default
			 */
			toAdd: function(key) {
				removeCallbacks(key);
				$("#pageContainer").load("templates/add.html", function() {
					$(".cancelAddBtn").on("click", function() {
						Events.event.cancelAdd(key);
					});
					
					$(".saveAddBtn").on("click", function() {
						Events.event.saveAdd(key);
					});
					Events.event.displayAdd(key);
				});
			},
			
			/**
			 *	This function navigates to the home page where
			 *	a list of all categories is displayed.
			 *	@param - none
			 */
			toHome: function() {
				removeCallbacks();
				
				//update main menu bar
				$("#backBtn").addClass("hidden");
				$("#headerTitle").text("Events");
				$("#deleteBtn").addClass("hidden");
				$("#demo-menu-lower-right").removeClass("hidden");
				
				$("#pageContainer").load("templates/home.html", function() {
					Events.category.displayAllCategories();
				});
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
				var ctx = document.getElementById("canvas1").getContext("2d"),
					canvasWidth = document.getElementById('canvas1').width,
					canvasHeight = document.getElementById('canvas1').height,
					dates = this.dates.reverse();
					
				scaleCanvas(document.getElementById('canvas1'));
					
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
			
			/**
			 *	This function populates the canvas with the time of day data. It 
			 * 	calculates the percentages of dates that fall into each time of
			 *	day. Morning is from 5am to 11:59pm, afternoon is from noon to 4:59pm,
			 *	evening is from 5pm to 11:59pm, night is from 12am to 4:59am. It
			 * 	then draws a pie chart on the canvas to represent the calculations.
			 *	@param color - the color to use on the canvas
			 */
			timeOfDay: function(color) {
				var ctx = document.getElementById("canvas2").getContext("2d"),
					timeOfDay = [0,0,0,0],
					total = 0,
					lastAngle = 2 * Math.PI * .25 * -1, //start with a vertical line
					offsetLeft = 0,
					canvasWidth = document.getElementById('canvas2').width,
					canvasHeight = document.getElementById('canvas2').height,
					dates = this.dates.reverse();
					
				scaleCanvas(document.getElementById('canvas2'));
					
				//count up the number of times each time of day is present
				for (var i=0; i<dates.length; i++) {
					var hour = dates[i].getHours();
					
					if (hour >= 5 && hour < 12) {
						//morning - 5:00am to 11:59am
						timeOfDay[0]++;
					} else if (hour >= 12 && hour < 17) {
						//afternoon - noon to 4:59pm
						timeOfDay[1]++;
					} else if (hour >= 17 && hour <= 23) {
						//evening - 5:00pm to 11:59pm
						timeOfDay[2]++;
					} else if (hour >= 0 && hour < 5) {
						//night - midnight to 4:59am
						timeOfDay[3]++;
					}
				}
				
				//add up the total number of entries
				for (var i=0; i<timeOfDay.length; i++) {
					total += timeOfDay[i];
				}
				
				ctx.globalAlpha = 1;
				var offsetTop = canvasHeight/6;
				var timeTexts = ['Morning', 'Afternoon', 'Evening', 'Night'];
				for (var i=0; i<timeOfDay.length; i++) {
					//draw pie chart sections
					ctx.fillStyle = color;
					ctx.globalAlpha = (.25 * i * 1) + .25;
					ctx.beginPath();
					ctx.moveTo(canvasHeight/2 - offsetLeft, canvasHeight/2);	//draw a line from the center to the start of the arc
					ctx.arc(canvasHeight/2 - offsetLeft, canvasHeight/2, canvasHeight/2 - offsetLeft, lastAngle, ((timeOfDay[i] / total) * 2 * Math.PI) + lastAngle, false);	//draw arc
					ctx.closePath();	//draw line from end or arc back to center of circle
					ctx.fill();
					
					lastAngle += (timeOfDay[i] / total) * 2 * Math.PI;
					
					//draw legend markers
					var width = 6,
						height = 25;
					ctx.fillRect(canvasHeight - offsetLeft + (canvasHeight/8), (canvasHeight/12) * ((2* i)+1) + offsetTop - (height/2), width, height);
					
					//draw legend text
					ctx.font = "11px Arial";
					ctx.globalAlpha = 1;
					ctx.fillStyle = "#000000";
					ctx.fillText(timeTexts[i], (canvasHeight - offsetLeft + (canvasHeight/8)) + 15, (canvasHeight/12) * ((2 * i)+1) + offsetTop - (height/2) + 9);
					ctx.fillText(Math.round((timeOfDay[i]/total) * 100) + "%", (canvasHeight - offsetLeft + (canvasHeight/8)) + 15, (canvasHeight/12) * ((2 * i)+1) + offsetTop - (height/2) + 23);
				}
				ctx.globalAlpha = 1;
			},
			
			/**
			 *	This function populates the canvas with the day of week data. It 
			 * 	calculates the percentages of dates that fall on each day of the 
			 *	week. It then draws a bar graph on the canvas to represent the 
			 * 	calculations.
			 *	@param color - the color to use on the canvas
			 */
			dayOfWeek: function(color) {
				var ctx = document.getElementById("canvas3").getContext("2d"),
					dayOfWeek = [0,0,0,0,0,0,0],
					maxDay = 0,
					canvasWidth = document.getElementById('canvas3').width,
					canvasHeight = document.getElementById('canvas3').height,
					dates = this.dates.reverse();
					
				scaleCanvas(document.getElementById('canvas3'));
				
				//count up the number of times each day of the week is present
				for (var i=0; i<dates.length; i++) {
					dayOfWeek[dates[i].getDay()]++;
				}
				
				//determine which day of the week has the most entries
				for (var i=1; i<dayOfWeek.length; i++) {
					if (dayOfWeek[i] > dayOfWeek[maxDay]) {
						maxDay = i;
					}
				}
				
				//draw day labels
				ctx.font = "11px Arial";
				ctx.fillStyle = "#000000";
				ctx.fillText("S",((canvasWidth)/14)*1 - 4,canvasHeight - 5);
				ctx.fillText("M",((canvasWidth)/14)*3 - 4,canvasHeight - 5);
				ctx.fillText("T",((canvasWidth)/14)*5 - 4,canvasHeight - 5);
				ctx.fillText("W",((canvasWidth)/14)*7 - 4,canvasHeight - 5);
				ctx.fillText("T",((canvasWidth)/14)*9 - 4,canvasHeight - 5);
				ctx.fillText("F",((canvasWidth)/14)*11 - 4,canvasHeight - 5);
				ctx.fillText("S",((canvasWidth)/14)*13 - 4,canvasHeight - 5);
				
				//draw graph bars
				ctx.fillStyle = color;
				for (var i=0; i<dayOfWeek.length; i++) {
					ctx.fillRect(((canvasWidth)/7)*i + 1, //bar is 1/7 the width of the canvas, i determines which bar, 1 gives side margin
					canvasHeight - (dayOfWeek[i]/dayOfWeek[maxDay]) * canvasHeight - 20,	//canvasHeight used since coordinates start at top, whatever percentage current day is of max day determines percentage of canvas height, 20 gives space for lettering at bottom
					((canvasWidth)/7)*1 - 2, 	//width is 1/7 the width of the canvas, 2 gives side margins
					(dayOfWeek[i]/dayOfWeek[maxDay]) * canvasHeight);
				}
				
				//draw percent labels
				ctx.fillStyle = "#ffffff";
				for (var i=0; i<dayOfWeek.length; i++) {
					ctx.fillText(Math.round((dayOfWeek[i]/dates.length)*100) + "%",((canvasWidth)/14)*((2*i)+1) - 8,canvasHeight - 27);
				}
			}
		}
	};
})();

