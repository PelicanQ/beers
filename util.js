define([], () => {
	
	const util = {
		rateRemaining: undefined,
		rateLimit: undefined,			
		coolingTimer: undefined,
		cooledDown: true
	};

	util.debounceAsync = (func) => {

		//Intended for use with fetchItems. Assume API uses whole hour time windows. 
		//Given remaining calls in that window, adjust debounce time accordingly.
		const now = Date.now();
		const msInHour = 60 * 60 * 1000;
		const nextHour = Math.ceil(now / msInHour) * msInHour;
		const debounceTime = (nextHour - now) / util.rateRemaining;

		//Return a promise that resolves when function is called.
		return new Promise((resolve, reject) => {
			let onCooledDown;
			if(util.cooledDown){
				//If called when timer was cooled down; Run immediately
				resolve(func());
				onCooledDown = () => {
					util.cooledDown = true;
				}
			}
			else {
				//If called when timer was cooling down; Que function
				onCooledDown = () => {
					resolve(func())
					util.cooledDown = true;
				}		
			}

			//Either way, clear what was qued before;
			util.cooledDown = false;
			clearTimeout(util.coolingTimer); // Previous promises are never rejected here...
			util.coolingTimer = setTimeout(onCooledDown, debounceTime)
		});
	};

	util.fetchItems = ({searchTerm,	page, perPage, food, yeast, malt, hops} = {}) => {
		const requestUrl = new URL("https://api.punkapi.com/v2/beers");

		//Could make variable names same as API parameters. That feels vulnerable to change though
		if(searchTerm){
			requestUrl.searchParams.set("beer_name", searchTerm.replace(" ", "_"));
		}
		if(page){
			requestUrl.searchParams.set("page", page);
		}
		if(perPage){
			requestUrl.searchParams.set("per_page", perPage);
		}
		if(food){
			requestUrl.searchParams.set("food", food.replace(" ", "_"));
		}
		if(yeast){
			requestUrl.searchParams.set("yeast", yeast.replace(" ", "_"));
		}
		if(malt){
			requestUrl.searchParams.set("malt", malt.replace(" ", "_"));
		}
		if(hops){
			requestUrl.searchParams.set("hops", hops.replace(" ", "_"));
		}

		//Return promise that resolves with beers array
		return fetch(requestUrl)
			.then((response) => {
				//Because of browser caching, remaining rate is not always true
				util.rateRemaining = parseInt(response.headers.get("x-ratelimit-remaining"));
				util.rateLimit = parseInt(response.headers.get("x-ratelimit"));

				if(!response.ok){
					throw new Error("Response not ok");
				}
				return response.json();
			});
	}

	return util;

});