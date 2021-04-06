require(["requireJS/domReady", "app", "util", "attachEventListeners"], (domReady, app, util, attachEventListeners) => {
	
	domReady(async () => {

		//Load search history from localsStorage
		const savedSearches = window.localStorage.getItem("recentSearches");
		if(savedSearches){
			app.recentSearches = JSON.parse(savedSearches);
		}
		app.refreshRecentSearches();

		attachEventListeners();

		//Read filter from URL
		const urlParams = new URLSearchParams(window.location.search);
		const filter = {};
		urlParams.forEach((value, key) => {
			filter[key] = value;
		});
		

		//Fetch beers using that filter
		let items;
		try {
			items = await util.fetchItems(filter);
		}
		catch(error){
			console.log(error);
			return;
		} 
		app.displayItems(items);


		//Now display filter parameters in their respective DOM elements
		app.filterToUI(filter);

		window.history.replaceState({filter}, "");
	});
	
});