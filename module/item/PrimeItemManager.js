Hooks.once("createItem", async function (hookData1, hookData2, hookData3) {
	PrimeItemManager.refreshItems(hookData1, hookData2, hookData3);
});

function safeResolveToArray(param) {
	const resolved = param == null
		? null
		: (Array.isArray(param))
			? param.length === 0
				? null
				: param
			: [param];
	return resolved;
}

export class PrimeItemManager {

	/**
	 *
	 * @param requestData
	 * @param {WorldCollection} requestData.itemCollection
	 * @param {boolean} (requestData.matchAll=true)
	 * @param {boolean} (requestData.justContentData=true)
	 * @param {boolean} (requestData.typed=false)
	 * @param {boolean} (requestData.sortItems=true)
	 * @param {[string] | string} (requestData.itemBaseTypes=null)
	 * @param {[{}] | {}} (requestData.filtersData=null)
	 * @returns {[PrimeItem] | [typeof BaseItem]}
	 */
	static getItems({itemCollection = ItemDirectory.collection,
						matchAll = true,
						justContentData = false,
						typed = false,
						sortItems = true,
						itemBaseTypes,
						filtersData}) {

		const resolvedItemBaseTypes = safeResolveToArray(itemBaseTypes);
		const resolvedFiltersData = safeResolveToArray(filtersData);

		const itemsByBaseTypes = resolvedItemBaseTypes == null
			? itemCollection
			: itemCollection.filter(({type}) => resolvedItemBaseTypes.includes(type));

		const matchingItems = resolvedFiltersData == null
			? itemsByBaseTypes
			: itemsByBaseTypes.filter((item) => this.testFilters(item, resolvedFiltersData, matchAll));

		if (sortItems) {
			matchingItems.sort(this.sortItems);
		}

		if (justContentData) {
			const justContentMatchingItems = matchingItems.map((item) => {
				const newItem = item.toObject(false);
				// Fixes issues whereby compendiums have new IDs assigned.
				newItem.data.sourceKey = item.id;
				newItem._id = undefined;
				return newItem;
			});
			return justContentMatchingItems;
		}

		if(typed) {
			const typedMatchingItems = matchingItems.map(item => item.dyn.typed);
			return typedMatchingItems;
		}

		return matchingItems;
	}

	static testFilters(item, filtersData, matchAll) {
		let allMatchsMade = true;
		let matchedOne = false;
		filtersData.forEach((filter) => {
			let match = this.testFilter(item, filter);
			if (!matchedOne && match) {
				matchedOne = true;
			}

			if (allMatchsMade && !match) {
				allMatchsMade = false;
			}
		});

		return ((matchAll && allMatchsMade) || (!matchAll && matchedOne));
	}

	static testFilter(item, filterData) {
		if (Array.isArray(filterData)) {
			return this.testFilterInArray(item, filterData);
		} else {
			return this.testFilterInObject(item, filterData);
		}
	}

	static testFilterInObject(item, filterData) {
		for (let key in filterData) {
			if (!item.hasOwnProperty(key)) {
				return false;
			}

			if ((typeof item[key] === 'object' && item[key] !== null) || (Array.isArray(item[key]))) {
				const recursiveResult = this.testFilterInObject(item[key], filterData[key]);
				if (!recursiveResult) {
					return false;
				}
			} else if (filterData[key] !== item[key]) {
				return false;
			}
		}
		return true;
	}

	static testFilterInArray(item, filterData) {
		let allMatched = true;
		filterData.forEach((filterDataElement, count) => {
			if (!typeof item[count] === 'undefined' || filterDataElement[count] !== item[count]) {
				allMatched = false;
			} else if ((typeof item[count] === 'object' && item[count] !== null) || (Array.isArray(item[count]))) {
				const recursiveResult = this.testFilterInObject(item[count], filterDataElement[count]);
				if (!recursiveResult) {
					allMatched = false;
				}
			}
		});

		return allMatched;
	}

	static refreshItems(hookData1, hookData2, hookData3) {
		console.log(hookData1, hookData2, hookData3);
	}

	static sortItems(itemA, itemB) {
		if (itemA.name) {
			var textA = itemA.name.toUpperCase();
			var textB = itemB.name.toUpperCase();
			return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
		}
		if (itemA.title) {
			var textA = itemA.title.toUpperCase();
			var textB = itemB.title.toUpperCase();
			return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
		}

		return 0;
	}
}