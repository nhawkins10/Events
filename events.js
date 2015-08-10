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
				var pw = pwParam || document.getElementById('loginPw').value
				console.log(user + " : " + pw);
				
				if (user != "" && pw != "") {
					dataRef.authWithPassword({
						email: user,
						password: pw
					}, function(error, userData) {
						if (error) {
							console.log("Login Failed!", error);
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
			
			/**
			 *	This function allows a new user to be created.
			 * 	@param none
			 */
			createUser: function() {
				var user = document.getElementById('loginUser').value,
					pw = document.getElementById('loginPw').value
				console.log(user + " : " + pw);
				
				if (user != "" && pw != "") {
					dataRef.createUser({
						email: user,
						password: pw
					}, function(error, userData) {
						if (error) {
							console.log("Create User Failed!", error);
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
					"<li><a href='../detail?q=" + key + "'>" + name + "</a></li>";
			},
			
			/**
			 *	This function adds a new category to the 
			 * 	current user's list of categories.
			 *	@param none
			 */
			addCategory: function() {
				var authTokens = JSON.parse(localStorage.events),
					newCatName = document.getElementById('newCatName').value,
					newCatColor = document.getElementById('newCatColor').value;
					
				if (newCatName != "") {
					dataRef.child("users").child(authTokens.uid).child("categories").push({
						name: newCatName,
						color: newCatColor
					});					
				}
			},
			
			/**
			 * 	This function deletes a category and all events
			 * 	that are associated with it.
			 */
			removeCategory: function() {
				var authTokens = JSON.parse(localStorage.events),
					key = location.search.substring(3, location.search.length-1);
				
				//remove the data
				dataRef.child("users").child(authTokens.uid).child("categories").child(key).remove();
				
				//return to the list of categories
				location.href = "../home";
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
				var key = location.search.substring(3, location.search.length-1),
					authTokens = JSON.parse(localStorage.events);
					
				//set default date and time
				document.getElementById("eventDate").value = toDateInputValue();
				document.getElementById("eventTime").value = toTimeInputValue();
				
				//set the title to the name of the category
				dataRef.child("users").child(authTokens.uid).child("categories").child(key).once("value", function(snapshot) {
					var name = snapshot.val();
					document.getElementById("eventHeader").innerHTML = name.name;
				});
				
				//display all events(timestamps) associated with the given category
				dataRef.child("users").child(authTokens.uid).child("categories").child(key).child("events").orderByChild("time").on("child_added", function(snapshot) {
					var temp = snapshot.val();
					Events.event.displayEntry(temp.time);
				});
			},
			
			/**
			 * 	This function creates the markup to display an event (timestamp) for a category.
			 * 	@param timestamp - the time of the event
			 */
			displayEntry: function(timestamp) {
				var entryList = document.getElementById("entryList");
				entryList.innerHTML = entryList.innerHTML + 
					"<li>" + timestamp + "</li>";
			},
			
			/**
			 *	This function adds a new event (timestamp) to the 
			 * 	currently selected category.
			 *	@param none
			 */
			addEvent: function() {	
				var date = document.getElementById("eventDate").value,
					time = document.getElementById("eventTime").value,
					key = location.search.substring(3, location.search.length-1),
					authTokens = JSON.parse(localStorage.events);
				
				//send the new value to the database
				dataRef.child("users").child(authTokens.uid).child("categories").child(key).child("events").push({
					time: date + " " + time
				});
			}
		}
	};
})();
