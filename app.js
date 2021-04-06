define(["util"], (util) => {
	
	const app = {
		defaultImgUrl: "images/missingBeer.jpg",
		recentSearches : [],
		refreshRecentSearches(){
			//Remove all elements in drop down menu and add new
			const searchesList = document.getElementById("recentSearchesList");
			searchesList.innerHTML = "";
			for(let i in app.recentSearches){
				let li = document.createElement("li");
				li.innerHTML = app.recentSearches[i];
				searchesList.appendChild(li);
			}
		},
		forgetSearches(){
			app.recentSearches.splice(0);
			window.localStorage.removeItem("recentSearches");
			app.refreshRecentSearches();
		},
		rememberSearch(searchTerm){
			if(searchTerm == ""){
				return;
			}
			//Save this search in localStorage
			if(!app.recentSearches.includes(searchTerm)){
				app.recentSearches.unshift(searchTerm); 
			}
			if(app.recentSearches.length > 5){
				app.recentSearches.splice(5);//Save the 5 most recent
			}
			
			//Remember despite page reloads
			window.localStorage.setItem("recentSearches", JSON.stringify(app.recentSearches));
			app.refreshRecentSearches();
		}
	};
	
	//Now the larger methods

	app.displayItems = (items) => {
		document.getElementById("beer").innerHTML = "";//Clear beer div
		const beerDiv = document.getElementById("beer");

		if(items.length == 0){//If no items were given
			const noneFoundElm = document.querySelector("#noItemsFound");
			noneFoundElm.classList.remove("invisible");
			return;
		}
		
		//Items were given. Append to document fragment (prevents reflow)
		const docFrag = document.createDocumentFragment();
		document.querySelector("#noItemsFound").classList.add("invisible");
		items.forEach((item) => {

			//Clone the hidden template
			const template = document.getElementById("itemTemplate").cloneNode(true);
			const title = template.querySelector(".itemTitle");
			template.id = "";

			//Extract info from item and put into clone
			title.querySelector(".itemName").innerHTML = `${item.name} ${item.abv}%`;
			title.querySelector(".itemTagLine").innerHTML = item.tagline;
			template.querySelector(".beerImage").src = item.image_url || app.defaultImgUrl;
			template.querySelector(".description").innerHTML = item.description;
			template.querySelector(".itemFoods").innerHTML = item.food_pairing.join(", ");
			template.querySelector(".itemYeast").innerHTML = item.ingredients.yeast;
			template.querySelector(".itemHops").innerHTML = item.ingredients.hops.map(hop => hop.name).join(", ");
			template.querySelector(".itemMalt").innerHTML = item.ingredients.malt.map(malt => malt.name).join(", ");
			
			//Clicking button drops a text box
			template.querySelector(".dropTextBtn").addEventListener("click", (event) => {  //TODO put ONE click listner on container instead
				event.target.classList.toggle("rotated");

				let wasShrunk = template.querySelector(".shrinkable").classList.toggle("shrunk"); 
				template.querySelector(".shrinkable").classList.toggle("extended", !wasShrunk);
			});
			docFrag.appendChild(template);
		});

		//Finally add fragment to real DOM
		beerDiv.appendChild(docFrag);
	}



	app.search = async () => {
		
		//First check what filters are chosen in UI
		const filter = {
			perPage: document.getElementById("perPageSelect").value
		};
		const searchBarInput = document.getElementById("searchBarInput");
		const foodFilterInput = document.getElementById("foodFilterInput");
		const yeastFilterInput = document.getElementById("yeastFilterInput");
		const hopsFilterInput = document.getElementById("hopsFilterInput");
		const maltFilterInput = document.getElementById("maltFilterInput");

		if(searchBarInput.value){
			filter.searchTerm = searchBarInput.value;
		}
		if(foodFilterInput.value){
			filter.food = foodFilterInput.value;
		}
		if(yeastFilterInput.value){
			filter.yeast = yeastFilterInput.value;
		}
		if(hopsFilterInput.value){
			filter.hops = hopsFilterInput.value;
		}
		if(maltFilterInput.value){
			filter.malt = maltFilterInput.value;
		}

		//Then fetch!
		let items;
		try {
			items = await util.debounceAsync(() => util.fetchItems(filter));
		}
		catch(error){
			console.log(error);
			return;
		}
		
		//fetch was successful. Update UI
		app.displayItems(items);

		if(filter.searchTerm && filter.searchTerm.length > 0){
			app.rememberSearch(filter.searchTerm);
		}

		const copy = Object.assign({}, filter);
		copy.page = "1";  //So that URL doesnt show ?page=1 when searching
		app.filterToUI(copy);

		//Update history.state
		const pageUrl = new URL(location.protocol + location.hostname + location.pathname); //Current page url without params
		for(const [key, value] of Object.entries(filter)){
			pageUrl.searchParams.set(key, value);
		}

		window.history.pushState({filter}, "", pageUrl);
	}



	app.navPage = async (direction) => {
		//We must be in a state to click next/prev
		if(!window.history.state)
			throw "No history.state";
		
		const filter = window.history.state.filter;
		if(!filter.page){
			filter.page = "1";
		}
		//Prevent going behind page 1 or beyond the last
		const numBeers = document.getElementById("beer").children.length; 
		if(direction === -1 && filter.page === "1" || (direction === 1 && numBeers === 0)){
			return; 
		}

		const newPage = (direction === -2) ? 1 : parseInt(filter.page) + direction; //direction of -2 means first page, -1 back, 1 next
		filter.page = newPage.toString();	     //Let future calls remember page change despite this one not completing
		
		// Now fetch!
		let items; 
		try {
			items = await util.debounceAsync(() => util.fetchItems(filter));
		}
		catch(error) {
			console.log(error);
			return;
		}
		
		//Fetch was successful
		app.displayItems(items);

		//Add as a new state
		const newURL = new URL(location.href);
		newURL.searchParams.set("page", newPage.toString());

		//Filter is a live reference used by other calls to this method. So make a copy
		const copyFilter = Object.assign({}, filter);
		copyFilter.page = newPage.toString();
		window.history.pushState({filter: copyFilter}, "", newURL);

		for(let pageElm of document.getElementsByClassName("currentPage")){
			pageElm.innerHTML = newPage;
		}
	}

	app.filterToUI = (filter) => {

		//Sync filtering elements in UI to "filter"
		const currentSearchTermElm = document.getElementById("currentSearchTerm");
		const perPageSelect = document.getElementById("perPageSelect");
		const searchBarInput = document.getElementById("searchBarInput");

		if(filter.searchTerm){
			searchBarInput.value = filter.searchTerm;
			currentSearchTermElm.querySelector("span").innerHTML = filter.searchTerm;
			currentSearchTermElm.classList.remove("invisible");
		}
		else {
			searchBarInput.value = "";
			currentSearchTermElm.classList.add("invisible");
		}

		for(let pageElm of document.getElementsByClassName("currentPage")){
			pageElm.innerHTML = filter.page || "1";
		}

		document.getElementById("foodFilterInput").value = filter.food || "";
		document.getElementById("yeastFilterInput").value = filter.yeast || "";
		document.getElementById("hopsFilterInput").value = filter.hops || "";
		document.getElementById("maltFilterInput").value = filter.malt || "";

		if(filter.perPage){
			//Lets find the <option> matching supplied filter.perPage
			const opts =  Object.values(perPageSelect.options);
			let optIndex = opts.findIndex((opt)=> opt.value == filter.perPage);

			if(optIndex < 0){
				//If no <option> matches: create new <option>
				let newOpt = opts[0].cloneNode(true);
				newOpt.value = newOpt.innerHTML = filter.perPage.toString();
				perPageSelect.prepend(newOpt);
				optIndex = 0;
			}
			perPageSelect.selectedIndex = optIndex;
		}
	}

	return app;
});