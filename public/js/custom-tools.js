
let loanObj = {},
    authObj = {};
let accountType = '';
let result = [];
let disableFields = false;
let userObj = {};
/*  Your fieldMaps can be an object with  
    fieldId as the key and empty string as the value.
*/
let fieldMaps = {
    // borrower
    '4000':'',
    '4001':'',
    '4002':'',
    '4003':'',
    '1402':'',
    '65':'',
    'FR0104':'',
    'FR0106':'',
    'FR0107':'',
    'FR0108':'',
    // co-borrower
    '4004':'',  
    '4005':'',
    '4006':'',
    '4007':'',
    '1403':'',
    '97':'',
    'FR0204':'',
    'FR0206':'',
    'FR0207':'',
    'FR0208':''
};
let loanData; // To be populated once you get loan data from Host
let gridBody = null;
let selectedData = {}; // For data selected from the grid to update Assets
let setFieldMaps = {};
let fieldList = Object.keys(fieldMaps);

// Invoke the mainInit() once the DOM is loaded
document.addEventListener("DOMContentLoaded", function(event) {
    mainInit();
});

function mainInit() {
    // CHeck if elli and elli.script exists before kicking off the 
    // process to create the guest and get data from Host
    if (elli && elli.script) {
        elli.script.guest.create('', document.head);
        // loanChangeEvent will be fired everytime you call setField function
        elli.script.subscribe('loan', 'change', loanChangeEvent);
        getObjects();
    }
    bindButtons();
    gridBody = document.querySelector('.account-search-result-body .scroller');
    initStateDropdown();
    selectedData = {};
}
async function loanChangeEvent(obj, data) {
    console.log('Loan change event fired: ', obj, data);
}
async function getObjects() {
    // Uses async/await to get the auth and loan objects
    authObj = await elli.script.getObject('auth');
    loanObj = await elli.script.getObject('loan');
    //getUserInfo();
    //getClientAuthCode(); //--> Implementation example for obtaining auth code
    getLoanObj();
    // get details of current user and build object
    authObj.getUser().then(resp => {
        userObj.id = resp.id;
        userObj.realm = resp.realm;     
    })
    /*  Check if loan is in ReadOnly mode :
        response from host is a boolean
    */
    loanObj.isReadOnly().then(resp => {
        // if loan is ReadOnly, disable all field in the tool
        if(resp) {
            // get buttons
            let domElement = document.getElementsByClassName('button');
            for (let item of domElement) {
                item.setAttribute('disabled', resp);
                item.classList.add('disabled');
            }
        } 
        // get values for all fields in the tool
        for(var i=0; i< fieldList.length; i++) {
            getField(fieldList[i], resp);
        }
    })
    .catch(err => {
        console.log('Error from isReadOnly', err);
    });
    
}
/*  getUserInfo() provides user information from host. 
    Response is an object in the following form :
    userObject = {
      id: 'userId',
      realm: 'realm',
      fistName: 'firstName',
      lastName: 'lastName'
    };
*/
function getUserInfo() {
    authObj.getUser().then(userInfo => {
        console.log('Heres the user from encw', userInfo);
    })
    .catch(err => {
        window.alert('Error while fetching user obj');
    }); 
}

/*  getClientAuthCode() provides user with an acccess_token from host. 
    Response is a string. This acccess_token can be used to make API calls 
    to DevConnect.
*/
function getClientAuthCode() {
    return authObj.createAuthCode().then(clientAuthCode => {
        //console.log('Heres the client auth code from encw', clientAuthCode);
    })
    .catch(err => {
        window.alert('Error while fetching user obj');
    }); 
}

/*  getLoanObj() gets the current workspace response from host.
    If the loan is not saved, this would still have the old copy of loan.
    Use merge() method to get the updated loan. More info below in merge().
*/
function getLoanObj() {
    loanObj.all().then(loanDataResp => {
        console.log('Heres the loan from encw', loanDataResp);
        loanData = loanDataResp;
    })
    .catch(err => {
    window.alert('Error while fetching loan obj');
    }); 
}

/*  getField gets the value for the provided fieldId(s) from Host.
    Input: 
        fieldId (type - integer, required)
        disableFields (type - boolean, optional)
    This function does not return anything
*/
function getField(fieldId, disableFields) {
    if(!fieldId) {
        alert('Please provide a fieldId value');
        return;
    }
    loanObj.getField(fieldId).then(loanFieldVal => {
        console.log(fieldId + ':' + loanFieldVal);
        let domEle = document.getElementById(fieldId);
        domEle.value = loanFieldVal || '';
        if(disableFields) {
            domEle.setAttribute('disabled', disableFields);
        }
        
    })
    .catch(err => {
    window.alert('Error while fetching loan obj');
    }); 
}

/*  setFields()
    Inputs: 
        id - fieldId that matches Encompass field Id: Optional IF passing in fieldMap
        val - Value to be set for the field id: Optional IF passing in fieldMap
*/
function setFields(id, val) {
    if(id && val) {
        setFieldMaps[id] = val;
    }
    loanObj.setFields(setFieldMaps);
}

/*  Calls merge() on the current loan and 
    returns the updated workspace loan data
*/ 
function getMerge() {
    loanObj.merge().then(resp => {
        console.log("On merge:", resp);
    }).catch(err => console.log('Merge error:', err));
}

/*  Calls calculate() on the current loan and 
    returns the updated workspace loan data
*/ 
function getCalc() {
    loanObj.calculate().then(resp => {
        console.log("On calc:", resp);
    }).catch(err => console.log('Calc error:', err));
}

/*  Setup the dropdown for states 
*/ 
function initStateDropdown() {
    let stateListHTML = window.stateList
    .map(state => {
        return `<option value="${state.stateId}">${state.stateName}</option>`;
    });
    stateListHTML.unshift(`<option value=""></option>`);
    document.querySelectorAll('.form-info.state-info select.form-value').forEach(function(el) {
        el.innerHTML = stateListHTML.join('');
    });
}

/* Bind actions to buttons from the form
*/ 
function bindButtons() {
    document.querySelector('.update-loan-button').addEventListener('click', updateLoan);
    document
    .querySelector('.forms-borrower-container .search-button')
    .addEventListener('click', searchAccountForBorrower);
    document
    .querySelector('.forms-coborrower-container .search-button')
    .addEventListener('click', searchAccountForCoBorrower);
    document
    .querySelector('.account-search-result-container .account-search-result-body')
    .addEventListener('click', function(event) {
        searchResultClick(event);
    });
}

/*  Initiate the "Search" based on values in the form
*/ 
function searchResultClick(event) {
    let target = event.target;
    if (target.tagName === 'INPUT' && target.classList.contains('check-box')) {
        let val = target.value;
        if (selectedData[val]) {
            delete selectedData[val];
        } else {
            selectedData[val] = val;
        }
    }
}

function updateLoan() {
    doUpdateAccountInfo('CoBorrower');
}

function searchAccountForBorrower() {
    doSearchAccountInfo('Borrower');
}
function searchAccountForCoBorrower() {
    doSearchAccountInfo('CoBorrower');
}

/*  Populate the grid based on the values
    entered in the tool/form
*/ 
function renderGridData(data) {
    if (data.length < 1) {
        gridBody.innerHTML = '';
        alert('No Account Information Found');
        return;
    } 
    const html = data.map(row => {
        const bName = row.borrower ? (row.borrower.firstName+ ' ' +row.borrower.lastName): '';
        const cbName = row.coborrower ? (row.coborrower.firstName+ ' ' +row.coborrower.lastName): '';
        const holderName = bName + ( cbName ? (', ' +cbName) : '');

        const bssn = row.borrower ? row.borrower.ssn : '';
        const cbssn = row.coborrower ? row.coborrower.ssn: '';
        const ssn = bssn + ( cbssn ? (', '+ cbssn) : '')
        return `
                <div class="account-row" id="${row.guid}">
                        <div class="body-fld cbx">
                            <input type="checkbox" class="check-box" value="${row.guid}"/>
                        </div>
                        <div class="body-fld accnt-hldr-nm">
                            <div class="grid-fld-label">Account Holder Name(s)</div>
                            <div>${holderName}</div>
                        </div>               
                        <div class="body-fld ssn">
                            <div class="grid-fld-label">SSN#</div>
                            <div>${ssn}</div>
                        </div>               
                        <div class="body-fld bank-name">
                            <div class="grid-fld-label">Bank Name</div> 
                            <div>${row.account.bankName}</div> 
                        </div>
                        <div class="body-fld accnt-type">
                            <div class="grid-fld-label">Account Type</div>
                            <div>${row.account.type}</div>
                        </div>
                        <div class="body-fld accnt-num">
                            <div class="grid-fld-label">Account Number</div>
                            <div>${row.account.number}</div>
                        </div>
                        <div class="body-fld cash-value">
                            <div class="grid-fld-label">Cash Value</div>
                            <div>${row.account.cash}</div>
                        </div>
                </div>
                `;
    });
    gridBody.innerHTML = html.join('');
}
/*  Get value for a field using the id attribute.
    The id attribute for each field is set to be 
    the fieldId from Encompass
*/
function getFieldValue(elId) {
    var val = document.getElementById(elId).value;
    if (val !== 'fieldMaps[id]'){
        return val || '';
    }
    return '';
}
/*  Perform search based on the type of user (borrower/co-borrower)
*/ 
function doSearchAccountInfo(type) {
    accountType = type;
    var firstName, lastName, ssn;
    type = type.toLowerCase();
    if (type === 'borrower') {
        firstName = getFieldValue('4000');
        lastName = getFieldValue('4002');
        ssn = getFieldValue('65');
    } else {
        firstName = getFieldValue('4004');
        lastName = getFieldValue('4006');
        ssn = getFieldValue('97');
    }
    if( (firstName && lastName) || ssn) {
        result = window.accountsBorrower.filter(function(row){
            if (row[type]) {
                if (ssn){
                    return row[type].ssn === ssn;
                } else if (firstName && lastName && !ssn){
                    return row[type].firstName.toLowerCase() === firstName.toLowerCase() && 
                        row[type].lastName.toLowerCase() === lastName.toLowerCase();
                } 
            }                
        });
        renderGridData(result);

    } else {
        alert('First Name, Last Name and/or SSN# are required to search for account information');
    }
}

/*  Initiates adding the assets to the loan
*/ 
function doUpdateAccountInfo() {
    let currentAppIndex = 0;
    const selectedRows = Object.keys(selectedData);
    const loanGuid = loanData.loan.id;
    let selectedAccounts = []; // list of accounts selected from the grid
    selectedRows.forEach(item => {
        var account = result[item].account;
        account.name = result[item].borrower.firstName+ ' ' +result[item].borrower.lastName;
        selectedAccounts.push(account)
    });
    loanData.loan.applications.forEach((item, index) => {
        if (item[accountType.toLowerCase()].fullName === selectedAccounts[0].name) {
            currentAppIndex = index;
        }
    });
    /*  Use legacyId field from the workspace as it corresponds to the 
        application id that matches the v1 loan.
        Using applicationId instead of legacyId is known to causes issues
        like updating the incorrect application in the loan.
    */    
    let appId = loanData.loan.applications[currentAppIndex].legacyId;
    if (selectedRows.length) {
        selectedRows.forEach(row => {
            console.info('doUpdateAccountInfo', row);
        });
        // add your authentic token id & secret key in next 2 lines
        let client_id_for_token = 'your_secret_key'; 
        let client_secret_for_token = 'your_secret_key';
        // create username to be used for token call
        let usernameForPayload = `${userObj.id}@encompass:${userObj.realm}`; // using ES6 template literals

        const bodyObj = createUrl({
            grant_type: 'password',
            username: usernameForPayload,
            password: '', // add the password for the instance
            client_id: client_id_for_token, 
            client_secret: client_secret_for_token
        });
        fetch('https://int.api.ellielabs.com/oauth2/v1/token', {
                method: 'POST',
                body: bodyObj,
                headers: {
                    'content-type': 'application/x-www-form-urlencoded'
                }
        }).then(response => {
            return response.json();
        })
        .then(res => {
            let assetsList = [];
            let startingAssetId = 18;
            let vodsList = loanData.loan.applications[currentAppIndex].vods;
            let vodIndex = vodsList && vodsList.length ? vodsList.length : 1;
            
            //  loop through vods[] to determine the startingAssetId to be used for 
            //  Id while updating/adding assets 
            vodsList.forEach(vod => {
                //startingAssetId = vod.items.length + startingAssetId; 
                vod.items.forEach(item => {
                    if(item.depositoryAccountName === selectedAccounts[0].name) {
                        startingAssetId++;
                    }
                })
            })
            
            selectedAccounts.forEach((item, index) => {
                let assetId = startingAssetId + index;
                if(!(assetId - startingAssetId === 0) && (assetId - startingAssetId)%4 === 0) {
                    vodIndex++;
                }
                assetsList.push({
                    "AccountIdentifier":item.number,
                    "AssetType": item.type.replace(/\s/g, ''),
                    "CashOrMarketValueAmount": item.cash,
                    "HolderName": item.bankName,
                    "IsVod":true,
                    "Owner": item.userType ? item.userType : accountType,
                    "VodIndex": vodIndex,
                    "Id": "Asset/" + assetId,
                    "DepositoryAccountName": item.name
                })
            });
            let bodyPayload = {
                "applications": [
                    {
                        "id":appId,
                        "assets":assetsList
                    }
                ]
            }
            // below URL should point to the environment you would use
            fetch(`https://int.api.ellielabs.com/encompass/v1/loans/${loanGuid}?view=Entity`, {
                method: 'PATCH',
                body: JSON.stringify(bodyPayload),
                headers: {
                    'content-type': 'application/json',
                    'authorization': 'Bearer ' + res.access_token
                }
            })
            .then(res => {
                return res.json();
            })
            .then(response => {
                console.log(response);
                // perform merge() to update the loanData to match the workspace loan
                loanObj.merge().then(resp => {
                    loanData = resp;
                }).catch(err => console.log('Merge error:', err));;
                removeSelected(selectedRows); // remove the added rows once process is complete
            });
            ;
        });
    }
}
function removeSelected(selectedRows) {
    selectedRows = selectedRows || [];
    selectedRows.forEach(function(row){
        console.log('deleting row', row)
        document.getElementById(row).remove();
        delete selectedData[row];
    });
}
function createUrl(data) {
    return Object.keys(data)
        .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(data[k]))
        .join('&');
}

function fetchData(url, cb, options) {
    let xhr = new XMLHttpRequest;
    xhr.open('GET', url, true)
    xhr.setRequestHeader('dataType', 'JSONP');
    xhr.onload = function() {
        if (this.status in {200:'', 304:''} ) {
            cb(JSON.parse(this.responseText))
        } else {
            // error
        }
    }
    xhr.send();  
}

