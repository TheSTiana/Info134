/**
 * Used to construct the datasets
 * @param url The url which the datasets are taken from
 * @constructor Constructs the datasets
 */
function Load(url) {
    let data = undefined;
    this.onload = null;
    this.getNames = function () {
        let names = [];
        for (let munName in this.getElements()) {
            names.push(munName);
        }
        return names.sort();
    };
    this.getIDs = function () {
        let ids = [];
        for (let mun in this.getElements()) {
            ids.push(this.getElements()[mun].kommunenummer);
        }
        return ids.sort();
    };
    this.getInfo = function (munNum) {
        const elements = this.getElements();
        for (let munName in elements) {
            if (elements[munName].kommunenummer === munNum) {

                return elements[munName];
            }
        }
    };
    this.getElements = function () {
        return data.elementer;
    }
    this.getData = function () {
        return data;
    }
    this.load = function () {
        let load = this;
        let xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                data = JSON.parse(xhr.responseText);
                if (load.onload != null) {
                    load.onload();
                }
            }
        };
        xhr.open("GET", url, true);
        xhr.send();
    }
}


let population = new Load("http://wildboy.uib.no/~tpe056/folk/104857.json");
population.load();
let employment = new Load("http://wildboy.uib.no/~tpe056/folk/100145.json");
employment.load();
let education = new Load("http://wildboy.uib.no/~tpe056/folk/85432.json");
education.onload = function () {
    console.log("All datasets have been downloaded.");
    enableNavigationButtons();
    makeOverviewTable();
};
education.load();

/**
 * Switch between which section or div is visible.
 * @param id The id corresponding to the section the user wants to see.
 */
function chooseSection(id) {
    let sections = document.getElementsByClassName("section");
    for (let div in sections) {
        sections.item(div).hidden = true; // Hides all the sections
    }
    document.getElementById(id).hidden = false; // Makes the chosen section visible
}

/**
 * Makes it impossible to navigate before the data is downloaded.
 */
function enableNavigationButtons() {
    document.getElementById("button-introduction").disabled = false;
    document.getElementById("button-overview").disabled = false;
    document.getElementById("button-details").disabled = false;
    document.getElementById("button-comparison").disabled = false;
}

/**
 * Checks if a number is legal.
 * First if the number results in something with the getInfo method for each dataset.
 * Then checks if the number results in the same municipality name.
 * @param munNum
 * @returns {boolean}
 */
function checkMunicipalityNumber(munNum) {
    return !(population.getInfo(munNum) === undefined || education.getInfo(munNum) === undefined || employment.getInfo(munNum) === undefined);
}

/**
 * Returns the municipality name corresponding to given number.
 * @param munNum Municipality number
 * @returns {string} The municipality name.
 */
function municipalityName(munNum) {
    for (let municipality in population.getElements())
        if (population.getElements()[municipality].kommunenummer === munNum)
            return municipality.toString();
    return "No municipality with that number";
}

/**
 * Finds total population in a municipality.
 * @param munName Municipality name
 * @param year The year one want data for
 * @returns {*} total population in a municipality
 */
function totalPopulationByName(munName, year = 2017) {
    return population.getElements()[munName]["Menn"][year.toString()] + population.getElements()[munName]["Kvinner"][year.toString()];
}

/**
 * Finds total population in a municipality.
 * @param munNum Municipality number
 * @param year The year one want data for
 * @returns {*} total population in a municipality
 */
function totalPopulations(munNum, year = 2017) {
    return population.getInfo(munNum)["Menn"][year] + population.getInfo(munNum)["Kvinner"][year];
}

/**
 * Finds the population change in a municipality.
 * @param munName Municipality name
 * @param firstYear Start year, default 2016
 * @param lastYear End year, default 2017
 * @returns {string} The population change
 */
function populationChange(munName, firstYear = 2016, lastYear = 2017) {
    return ((totalPopulationByName(munName, lastYear) - totalPopulationByName(munName, firstYear)) / totalPopulationByName(munName, firstYear) * 100).toFixed(2);
}

/**
 * Finds the employment rate in a municipality.
 * @param munNum Municipality number
 * @param year The year one want data for
 * @returns {string} Employment rate for given municipality
 */
function employmentRate(munNum, year = 2017) {
    let rate = employment.getInfo(munNum)["Begge kjønn"][year];
    return rate.toFixed(2);
}

/**
 * Finds out how many people are employed in a municipality.
 * @param munNum Municipality Number
 * @param year The year one want data for
 * @returns {string} Number of employed people in a municipality
 */
function employmentNumber(munNum, year = 2017) {
    let percent = employmentRate(munNum, year);
    let totalPop = totalPopulations(munNum, year);
    return Number(totalPop * percent / 100).toFixed(0);
}

/**
 * Finds educational rate for a specific educational category and for a specific gender.
 * @param munNum Municipality number
 * @param category Educational category
 * @param sex Which gender one want data for
 * @param year The year one want data for
 * @returns {string} Education rate
 */
function educationSpecific(munNum, category, sex, year = 2017) {
    return Number(education.getInfo(munNum)[category][sex][year]).toFixed(2);
}

/**
 * Finds the combined educational rate for a specific educational category.
 * @param munNum Municipality number
 * @param category Educational category
 * @param year The year one want data for
 * @returns {string} Education rate
 */
function educationSpecificCombined(munNum, category, year = 2017) {
    let men = education.getInfo(munNum)[category]["Menn"][year];
    let women = education.getInfo(munNum)[category]["Kvinner"][year];
    return Number(men + women).toFixed(2);
}

/**
 * Finds out how many people has finished a specific educational level in given municipality.
 * @param munNum Municipality number
 * @param category Educational category
 * @param year The year one want data for
 * @returns {string} Number of people with given educational level.
 */
function educationNumber(munNum, category, year = 2017) {
    let percent = educationSpecificCombined(munNum, category, year);
    let totalPop = totalPopulations(munNum, year);
    return Number(totalPop * percent / 100).toFixed(0);
}

/* Overview */

/**
 * Makes the overview table.
 */
function makeOverviewTable() {
    let municipalities = population.getElements();
    //Make the head row
    let tableHeaderRow = document.createElement("tr");
    tableHeaderRow.innerHTML = `<th>Kommunenr</th>
                                <th>Kommunenavn</th>
                                <th>Befolkning 2017</th>
                                <th>Befolkningsendring (2016-2017)</th>`;
    document.getElementById("overview-table").appendChild(tableHeaderRow);
    //Make each row
    for (let munName in municipalities) {
        let tableRow = document.createElement("tr");
        tableRow.innerHTML = `<td>${municipalities[munName].kommunenummer}</td>
                                <td>${munName}</td>
                                <td>${totalPopulationByName(munName)}</td>
                                <td>${populationChange(munName) + " %"}</td>`;
        document.getElementById("overview-table").appendChild(tableRow);
    }
}

/* Details */

/**
 * Clears the detail section.
 * Gets the value the user inputted anc checks if it is legal.
 * If it is not legal the user is informed.
 * If it is legal it calls the methods to make the list and table.
 */
function composeDetails() {
    document.getElementById("details-list").innerHTML = "";
    document.getElementById("details-table").innerHTML = "";
    let munNum = document.getElementById("input-details").value;
    if (checkMunicipalityNumber(munNum) === true) {
        munNum = String(munNum);
        detailsList(munNum);
        detailTable(munNum);
    } else {
        document.getElementById("details-list").innerHTML = `<h2>Ingen treff på nummeret, dobbeltskjekk at det er gyldig.</h2>`;
    }
}

/**
 * Makes the list of details.
 * @param munNum The municipality the list shall represent.
 */
function detailsList(munNum) {
    let munName = municipalityName(munNum);
    let munInfo = document.createElement("p");
    munInfo.innerHTML =
        `<p><b>${munName}</b></br>
        <b>Kommunenr:</b>                            ${munNum}</br>
        <b>Befolkning:</b>                           ${totalPopulations(munNum)}</br>
        <b>Universitets- og høgskolenivå kort:</b>   ${educationNumber(munNum, "03a")} (${educationSpecificCombined(munNum, "03a")}%)</br>
        <b>Universitets- og høgskolenivå lang:</b>   ${educationNumber(munNum, "04a")} (${educationSpecificCombined(munNum, "04a")}%)</br>
        <b>Sysselsetting:</b>                        ${employmentNumber(munNum)} (${employmentRate(munNum)}%)`;
    document.getElementById("details-list").appendChild(munInfo);
}

/**
 * Makes the detail table.
 * @param munNum The municipality the table shall represent.
 */
function detailTable(munNum) {
    let munName = municipalityName(munNum);
    // Make the head rows, which will be made vertical with css.
    let tableHeaderRow = document.createElement("tr");
    tableHeaderRow.innerHTML = `<th>År</th>
                                <th>Befolkning</th>
                                <th>Sysselsatte</th>
                                <th>Grunnskole</th>
                                <th>Vidregående</th>
                                <th>Fagskole</th>
                                <th>Universitets- og høgskolenivå kort</th>
                                <th>Universitets- og høgskolenivå lang</th>`;
    document.getElementById("details-table").appendChild(tableHeaderRow);
    // Make each row from 2007 to 2018 as those are the years included in all three sets.
    for (let year = 2007; year < 2018; year++) {
        let tableRow = document.createElement("tr");
        tableRow.innerHTML = `<td>${year}</td>
                                <td>${totalPopulations(munNum, year)}</td>
                                <td>${employmentRate(munNum, year)}%</td>
                                <td>${educationSpecificCombined(munNum, "01", year)}%</td>
                                <td>${educationSpecificCombined(munNum, "02a", year)}%</td>
                                <td>${educationSpecificCombined(munNum, "11", year)}%</td>
                                <td>${educationSpecificCombined(munNum, "03a", year)}%</td>
                                <td>${educationSpecificCombined(munNum, "04a", year)}%</td>`;
        document.getElementById("details-table").appendChild(tableRow);
    }
}

/* Comparison*/

/**
 * Clears the comparison section.
 * Then gets the values the user inputted and checks if they are legal.
 * If they are not legal or the numbers are the same a message informs the user.
 * If the numbers are legal the method to make the table are called.
 */
function composeComparison() {
    document.getElementById("comparison-message").innerHTML = "";
    document.getElementById("comparison-table").innerHTML = "";

    let munNumOne = document.getElementById("input-comparison-one").value;
    let munNumTwo = document.getElementById("input-comparison-two").value;
    if (munNumOne === munNumTwo) {
        document.getElementById("comparison-message").innerHTML = "Nummerne er like.";
    } else if (checkMunicipalityNumber(munNumOne) === true && checkMunicipalityNumber(munNumTwo) === true) {
        comparisonTable(munNumOne, munNumTwo);
    } else {
        document.getElementById("comparison-message").innerHTML = "Ingen treff på de nummerne, dobbeltskjekk at de er gyldige.";
    }
}

/**
 * Makes the comparison table and
 * Announce a winner municipality, as long as they do not tie.
 * @param munNumOne Number of the first municipality
 * @param munNumTwo Number of the second municipality
 */
function comparisonTable(munNumOne, munNumTwo) {
    let munNameOne = municipalityName(munNumOne);
    let munNameTwo = municipalityName(munNumTwo);

    let categories = education.getData().datasett.kategorier; //Educational categories

    let munNameRow = document.createElement("tr"); // Table header where the municipality names are.
    munNameRow.innerHTML = `<th></th><th>${munNameOne}</th><th>${munNameTwo}</th><th>${munNameOne}</th><th>${munNameTwo}</th>`;
    document.getElementById("comparison-table").appendChild(munNameRow);

    let genderRow = document.createElement("tr"); // Table header for gender information.
    genderRow.innerHTML = `<th>Kjønn</th><td>Kvinner</td><td>Kvinner</td><td>Menn</td><td>Menn</td>`;
    document.getElementById("comparison-table").appendChild(genderRow);

    let munOneCounter = 0; // Counters to keep track of how many educational categories one municipality best the other in.
    let munTwoCounter = 0; // Later these are used to announce a winner or a tie.

    Object.entries(categories).forEach(([key, value]) => { //iterates over keys and values in categories
        let womanOneClass = "standard"; // Not winner, will also be assigned if tied.
        let womanTwoClass = "standard"; // this allows the winner cells to be formatted.
        let manOneClass = "standard";
        let manTwoClass = "standard";

        let womanOne = educationSpecific(munNumOne, key, "Kvinner"); // Assign values
        let womanTwo = educationSpecific(munNumTwo, key, "Kvinner"); // Assign values
        if (womanOne > womanTwo) { // Checks if the data for the women of one municipalities are higher than the other.
            munOneCounter++;
            womanOneClass = "winner";
        } else if (womanOne < womanTwo) {
            munTwoCounter++;
            womanTwoClass = "winner";
        } // If it is a tie no counter is raised and no td gets the winner class.

        let manOne = educationSpecific(munNumOne, key, "Menn"); // Assign value
        let manTwo = educationSpecific(munNumTwo, key, "Menn"); // Assign values
        if (manOne > manTwo) { // Checks if the data for the men of one municipalities are higher than the other.
            munOneCounter++;
            manOneClass = "winner";
        } else if (manOne < manTwo) {
            munTwoCounter++;
            manTwoClass = "winner";
        }// If it is a tie no counter is raised and no td gets the winner class.

        let tableRow = document.createElement("tr"); // Constructs the table rows for the educational code.
        tableRow.innerHTML = `<th>${value}</th>
                                <td class="${womanOneClass}">${womanOne}%</td>
                                <td class="${womanTwoClass}">${womanTwo}%</td>
                                <td class="${manOneClass}">${manOne}%</td>
                                <td class="${manTwoClass}">${manTwo}%</td>`;
        document.getElementById("comparison-table").appendChild(tableRow);
    });

    // Check if a municipal "won" over the another, if the winner is announced.
    if (munOneCounter > munTwoCounter) {
        document.getElementById("comparison-message").innerHTML = `${munNameOne} slår ${munNameTwo} i utdanning.`;
    } else if (munOneCounter < munTwoCounter) {
        document.getElementById("comparison-message").innerHTML = `${munNameTwo} slår ${munNameOne} i utdanning.`;
    } else {
        document.getElementById("comparison-message").innerHTML = `Uavgjort mellom ${munNameOne} og ${munNameTwo} i utdanning.`;
    }
}

/**
 * Prints out info in the console which was used to answer the last question in the rapport.
 */
function checkDataset() {
    console.log("Check dataset");
    console.log("Number of IDs in Population: " + population.getIDs().length);
    console.log("Number of names in Population: " + population.getNames().length);
    console.log("Number of IDs in Employment: " + employment.getIDs().length);
    console.log("Number of names in Employment: " + employment.getNames().length);
    console.log("Number of IDs in Education: " + education.getIDs().length);
    console.log("Number of names in Education: " + education.getNames().length);

    let popMunNames = population.getNames();
    let empMunNames = employment.getNames();
    let eduMunNames = education.getNames();

    for (let i = 0; i < eduMunNames.length; i++) {
        let mun = education.getNames()[i];
        if (!(popMunNames.includes(mun))) {
            console.log("Population does not include " + mun + " but education does");
        }
        if (!(empMunNames.includes(mun))) {
            console.log("Employment does not include " + mun + " but education does");
        }
    }
    for (let i = 0; i < popMunNames.length; i++) {
        let mun = popMunNames[i];
        if (!(empMunNames.includes(mun))) {
            console.log("Employment does not include " + mun + " but population does");
        }
        if (!(eduMunNames.includes(mun))) {
            console.log("Education does not include " + mun + " but population does");
        }
    }
    for (let i = 0; i < empMunNames.length; i++) {
        let mun = empMunNames[i];
        if (!(popMunNames.includes(mun))) {
            console.log("Population does not include " + mun + " but employee does");
        }
        if (!(eduMunNames.includes(mun))) {
            console.log("Education does not include " + mun + " but employee does");
        }
    }
    console.log("Done checking dataset");
}