
export class PrimeTables
{
	static cloneAndTranslateTables(whatPath)
	{
		var tableClone = this.cloneTables(whatPath);
		this.addTranslations(tableClone);
		
		return tableClone;
	}

	static cloneTables(path)
	{
		var pathSplit = path.split(".");
		var count = 0;
		var currTable = game.system.template.Tables
		while (count < pathSplit.length)
		{
			var currPathSplit = pathSplit[count];
			if (currTable[currPathSplit])
			{
				currTable = currTable[currPathSplit]
			}
			else
			{
				console.error("ERROR: Unable to find the table reference. path: '" + path + "', failed portion: '" + currPathSplit + "'. Base table data: ", game.system.template.Tables)
			}
			count++;
		}

		if (Array.isArray(currTable))
		{
			return $.extend(true, [], currTable);
		}
		else
		{
			return $.extend(true, {}, currTable);
		}
	}

	static addTranslations(whatData)
	{
		for (var key in whatData)
		{
			if (whatData[key].indexOf)
			{
				var _primeDataIndex = whatData[key].indexOf("PRIME.");
			}

			if (key == "title" || key == "description" || _primeDataIndex === 0)
			{
				var translation = game.i18n.localize(whatData[key]);
				whatData[key] = translation;
			}
			if (typeof whatData[key] === 'object' && whatData[key] !== null)
			{
				this.addTranslations(whatData[key]);
			}
			_primeDataIndex = false;
		}
	}

	static getTitleFromTableByKey(key, path)
	{
		var table = PrimeTables.cloneTables(path);
		var count = 0;
		while (count < table.length)
		{
			let entry = table[count];
			if (entry.key == key)
			{
				return game.i18n.localize(entry.title);
			}
			count++;
		}
		console.error("ERROR: Unable to find an entry with the key of '" + key + "' in: ", table);
		return "";
	}

	static getTitlesFromTableByCheckboxGroupArray(checkboxGroupArray, path)
	{
		var titlesArray = [];
		var table = PrimeTables.cloneAndTranslateTables(path);

		if (checkboxGroupArray.length != table.length)
		{
			console.warn("WARNING: Mismatched lengths between checkbox group array and data table.", checkboxGroupArray, table);
		}

		var count = 0;
		while (count < checkboxGroupArray.length)
		{
			if (checkboxGroupArray[count])
			{
				let entry = table[count];
				titlesArray.push("<span title='" + entry.description + "' class='hasTooltip'>" + entry.title + "</span>");
			}
			count++;
		}

		if (titlesArray.length == 0)
		{
			titlesArray.push("None");
		}
		return titlesArray.join(", ");
	}

	static getPrimeKeysAndTitles()
	{
		const basePrimeData = game.system.template.Actor.templates.primes_template.primes;
		const keyTitleArray = this.getKeyAndTitleData(basePrimeData);

		return keyTitleArray;
	}

	static getRefinementKeysAndTitles()
	{
		const baseRefinementsData = game.system.template.Actor.templates.refinements_template.refinements;
		const keyTitleArray = this.getKeyAndTitleData(baseRefinementsData);

		return keyTitleArray;
	}

	static getKeyAndTitleData(whatKeyIndexedData)
	{
		let keyTitleArray = [];
		let currEntry = null;
		for (let key in whatKeyIndexedData)
		{
			currEntry = whatKeyIndexedData[key];
			keyTitleArray.push({key: key, title: game.i18n.localize(currEntry.title)});
		}
		return keyTitleArray;
	}

	static getActionKeysAndTitles()
	{
		return [{key: "null", title:"Dynamic actions list coming soon (TM)"}];
	}

	static getItemKeysAndTitlesByType(typeFilter)
	{
		var matchingItems = []
		ItemDirectory.collection.forEach((item, key, items) =>
		{
			if (item.type == typeFilter || typeFilter == "*")
			{
				matchingItems.push({key: key, title: item.name})
			}
		});

		return matchingItems;
	}
}