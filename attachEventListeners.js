define(["app", "util"], (app, util) => {

	return () => {

		//Declare references
		const searchBar = document.getElementById("searchBarInput");
		const searchBtn = document.getElementById("searchButton");
		const dropDown = document.getElementById("dropDownMenu");
		const searchesList = document.getElementById("recentSearchesList");
		const forgetHistoryBtn = document.getElementById("forgetSearchesButton");
		const currentSearchTermElm = document.getElementById("currentSearchTerm");
		const navButtonsArray = document.getElementsByClassName("navButtons");
		const dropFilterBtn = document.getElementById("dropFilterBtn");
		const filterOptions = document.getElementById("filterOptions");
		
		searchBar.addEventListener("focus", (event) => {
			dropDown.classList.remove("hidden");
		});

		searchBar.addEventListener("blur", (event) => {
			dropDown.classList.add("hidden");
		});

		searchBar.addEventListener("input", (event) => {
			const currentTerm = event.target.value;
			
			for(const li of searchesList.children){
				if(li.innerHTML.indexOf(currentTerm) < 0){
					li.classList.add("hidden");
				}
				else {
					li.classList.remove("hidden");
				}
			}

		});

		searchBar.addEventListener("keydown", (event) => {
			if(event.keyCode === 13){//Enter key pressed
				app.search();
			}
		});

		searchesList.addEventListener("mousedown", (event) => {
			//mousedown because it fires before blur which hides the menu
			searchBar.value = event.target.innerHTML;
		});

		forgetSearchesButton.addEventListener("mousedown", () => {
			app.forgetSearches();
		});

		searchBtn.addEventListener("click", (event) => {
			app.search();
		});

		dropFilterBtn.addEventListener("click", (event) => {
			event.target.classList.toggle("rotated");
		
			const wasShrunk = filterOptions.classList.toggle("fullHeight");
			filterOptions.classList.toggle("noHeight", !wasShrunk);
			
		})

		document.getElementById("applyFilterBtn").addEventListener("click", (event) => {
			app.search();
		});

		document.getElementById("clearFilterBtn").addEventListener("click", (event) => {
			document.getElementById("foodFilterInput").value = "";
			document.getElementById("yeastFilterInput").value = "";
			document.getElementById("hopsFilterInput").value = "";
			document.getElementById("maltFilterInput").value = "";
			document.getElementById("perPageSelect").selectedIndex = 2; //Not the best: I must manually make sure the html default is the 2nd option
			app.search();
		});

		for(let navButtons of navButtonsArray){//Since there are multiple navbutton boxes
			navButtons.querySelector(".navigateFirst").addEventListener("click", (event) => {
				app.navPage(-2);
			});
			navButtons.querySelector(".navigatePrev").addEventListener("click", (event) => {
				app.navPage(-1);
			});
			navButtons.querySelector(".navigateNext").addEventListener("click", (event) => {
				app.navPage(1);
			});
		} 

		window.addEventListener("popstate", async (event) => {
			const filter = event.state.filter;

			let items;
			try {
				items = await util.debounceAsync(() => util.fetchItems(filter));
			}
			catch(error){
				console.log(error);
				return;
			}

			app.displayItems(items);
			app.filterToUI(filter);
		});
	}
})